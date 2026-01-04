// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IExternalSigner } from "./interfaces/IExternalSigner.sol";
import { IGroth16Verifier } from "./interfaces/IGroth16Verifier.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title BiometricRecoverySigner
/// @notice External key type for Porto that enables face-based account recovery
/// @dev Verifies ZK liveness proofs from Bionetta and face-derived ECDSA signatures
/// @custom:security-contact security@villa.cash
contract BiometricRecoverySigner is IExternalSigner {
    using ECDSA for bytes32;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a face is enrolled for an account
    event FaceEnrolled(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);

    /// @notice Emitted when a face enrollment is revoked
    event FaceRevoked(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);

    /// @notice Emitted when recovery is executed
    event RecoveryExecuted(address indexed account, uint256 indexed nonce, uint256 timestamp);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidLivenessProof();
    error InvalidFaceSignature();
    error NonceAlreadyUsed();
    error FaceNotEnrolled();
    error FaceAlreadyEnrolled();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The Groth16 verifier for liveness proofs
    IGroth16Verifier public immutable livenessVerifier;

    /// @notice Maps account => face-derived key hash (from fuzzy extractor)
    mapping(address account => bytes32 faceKeyHash) public enrolledFaceKeyHashes;

    /// @notice Maps account => last used nonce (prevents replay)
    mapping(address account => uint256 nonce) public recoveryNonces;

    /// @notice Maps account => enrollment timestamp (for audit)
    mapping(address account => uint256 timestamp) public enrollmentTimestamps;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _livenessVerifier Address of deployed Groth16 liveness verifier
    constructor(address _livenessVerifier) {
        if (_livenessVerifier == address(0)) revert ZeroAddress();
        livenessVerifier = IGroth16Verifier(_livenessVerifier);
    }

    /*//////////////////////////////////////////////////////////////
                            ENROLLMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Enroll a face-derived key hash for an account
    /// @dev Must be called by the account itself (via Porto execute)
    /// @param faceKeyHash The keccak256 hash of the face-derived public key
    /// @param livenessProof ZK proof that face capture was live
    function enrollFace(bytes32 faceKeyHash, bytes calldata livenessProof) external {
        address account = msg.sender;

        if (enrolledFaceKeyHashes[account] != bytes32(0)) {
            revert FaceAlreadyEnrolled();
        }

        if (!_verifyLiveness(livenessProof)) {
            revert InvalidLivenessProof();
        }

        enrolledFaceKeyHashes[account] = faceKeyHash;
        enrollmentTimestamps[account] = block.timestamp;

        emit FaceEnrolled(account, faceKeyHash, block.timestamp);
    }

    /// @notice Revoke face enrollment (owner only, via Porto execute)
    function revokeFace() external {
        address account = msg.sender;
        bytes32 oldHash = enrolledFaceKeyHashes[account];

        if (oldHash == bytes32(0)) {
            revert FaceNotEnrolled();
        }

        delete enrolledFaceKeyHashes[account];
        delete enrollmentTimestamps[account];

        emit FaceRevoked(account, oldHash, block.timestamp);
    }

    /// @notice Update face enrollment (revoke and re-enroll in one tx)
    /// @param newFaceKeyHash The new face-derived key hash
    /// @param livenessProof ZK proof for new face capture
    function updateFace(bytes32 newFaceKeyHash, bytes calldata livenessProof) external {
        address account = msg.sender;

        if (!_verifyLiveness(livenessProof)) {
            revert InvalidLivenessProof();
        }

        bytes32 oldHash = enrolledFaceKeyHashes[account];
        enrolledFaceKeyHashes[account] = newFaceKeyHash;
        enrollmentTimestamps[account] = block.timestamp;

        if (oldHash != bytes32(0)) {
            emit FaceRevoked(account, oldHash, block.timestamp);
        }
        emit FaceEnrolled(account, newFaceKeyHash, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                        SIGNATURE VERIFICATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Verify signature for Porto External key type
    /// @dev Called by Porto account during recovery authorization
    /// @param digest The EIP-712 digest that was signed
    /// @param signature Packed: abi.encode(livenessProof, faceSignature, nonce)
    /// @param keyHash The key hash registered in Porto (should match enrolledFaceKeyHash)
    function isValidSignatureWithKeyHash(
        bytes32 digest,
        bytes calldata signature,
        bytes32 keyHash
    ) external view override returns (bool) {
        address account = msg.sender;

        // Decode packed signature
        (bytes memory livenessProof, bytes memory faceSignature, uint256 nonce) =
            abi.decode(signature, (bytes, bytes, uint256));

        // Verify liveness proof
        if (!_verifyLiveness(livenessProof)) {
            return false;
        }

        // Verify nonce is greater than last used (prevents replay)
        if (nonce <= recoveryNonces[account]) {
            return false;
        }

        // Verify the keyHash matches enrolled face
        bytes32 enrolledHash = enrolledFaceKeyHashes[account];
        if (enrolledHash == bytes32(0) || enrolledHash != keyHash) {
            return false;
        }

        // Verify ECDSA signature from face-derived key
        return _verifyFaceSignature(digest, faceSignature, enrolledHash);
    }

    /// @notice Consume a nonce after successful recovery (called by account)
    /// @param nonce The nonce that was used
    function consumeNonce(uint256 nonce) external {
        address account = msg.sender;
        if (nonce <= recoveryNonces[account]) {
            revert NonceAlreadyUsed();
        }
        recoveryNonces[account] = nonce;
        emit RecoveryExecuted(account, nonce, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if an account has face recovery enrolled
    function isEnrolled(address account) external view returns (bool) {
        return enrolledFaceKeyHashes[account] != bytes32(0);
    }

    /// @notice Get the next valid nonce for an account
    function getNextNonce(address account) external view returns (uint256) {
        return recoveryNonces[account] + 1;
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev Verify ZK liveness proof via Groth16 verifier
    function _verifyLiveness(bytes memory proof) internal view returns (bool) {
        if (proof.length < 4) {
            return false; // Minimum valid proof size for prefix check
        }

        try livenessVerifier.verifyProof(proof) returns (bool isValid) {
            return isValid;
        } catch {
            return false;
        }
    }

    /// @dev Verify ECDSA signature against enrolled face key hash
    function _verifyFaceSignature(
        bytes32 digest,
        bytes memory signature,
        bytes32 expectedKeyHash
    ) internal pure returns (bool) {
        // Recover signer from ECDSA signature
        (address recovered, ECDSA.RecoverError error,) = digest.tryRecover(signature);

        if (error != ECDSA.RecoverError.NoError) {
            return false;
        }

        // Hash recovered address and compare to enrolled key hash
        bytes32 recoveredHash = keccak256(abi.encode(recovered));
        return recoveredHash == expectedKeyHash;
    }
}
