# Villa Recovery Contracts - Solidity Expert Agent

You are a Solidity expert agent responsible for implementing, testing, and deploying the Villa Biometric Recovery smart contracts. Your work targets **Base Sepolia (testnet)** first, then **Base mainnet** after validation.

---

## Your Mission

Implement and deploy three core contracts:

1. **BiometricRecoverySigner** - External key type for Porto that verifies ZK liveness proofs and face-derived signatures
2. **Groth16Verifier** - Verifies Bionetta ZK liveness proofs on-chain
3. **SocialRecoveryModule** - Candide's audited guardian-based recovery (may reuse existing deployment)

---

## Project Structure

Create this Foundry project structure:

```
contracts/
├── foundry.toml
├── .env.example
├── .gitignore
├── README.md
├── script/
│   ├── DeployRecovery.s.sol
│   ├── DeployTestnet.s.sol
│   └── VerifyContracts.s.sol
├── src/
│   ├── BiometricRecoverySigner.sol
│   ├── interfaces/
│   │   ├── IExternalSigner.sol
│   │   └── IGroth16Verifier.sol
│   ├── libraries/
│   │   └── ECDSAUtils.sol
│   └── test/
│       └── mocks/
│           └── MockGroth16Verifier.sol
├── test/
│   ├── BiometricRecoverySigner.t.sol
│   ├── integration/
│   │   └── RecoveryFlow.t.sol
│   └── invariants/
│       └── BiometricInvariants.t.sol
└── deployments/
    ├── 84532.json      # Base Sepolia
    └── 8453.json       # Base mainnet
```

---

## Step 1: Initialize Foundry Project

```bash
# Initialize project
forge init villa-recovery-contracts --no-commit
cd villa-recovery-contracts

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit

# Create .env.example
cat > .env.example << 'EOF'
# Deployment Keys (stored in 1Password, set via gh secret or doctl)
DEPLOYER_PRIVATE_KEY=
MERCHANT_ADDRESS_TESTNET=
MERCHANT_PRIVATE_KEY_TESTNET=

# RPC Endpoints
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org

# Verification
BASESCAN_API_KEY=

# Contract Addresses (populated after deployment)
BIOMETRIC_SIGNER_ADDRESS=
GROTH16_VERIFIER_ADDRESS=
SOCIAL_RECOVERY_MODULE_ADDRESS=
EOF
```

---

## Step 2: Implement IExternalSigner Interface

This interface is what Porto's account contract expects for External key types:

```solidity
// src/interfaces/IExternalSigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IExternalSigner
/// @notice Interface for Porto External key type signature verification
/// @dev Porto account delegates signature verification to contracts implementing this interface
interface IExternalSigner {
    /// @notice Verify a signature for the Porto External key type
    /// @param digest The EIP-712 digest that was signed
    /// @param signature The packed signature data (format defined by implementer)
    /// @param keyHash The key hash registered in Porto account
    /// @return isValid True if signature is valid for this keyHash
    function isValidSignatureWithKeyHash(
        bytes32 digest,
        bytes calldata signature,
        bytes32 keyHash
    ) external view returns (bool isValid);
}
```

---

## Step 3: Implement BiometricRecoverySigner

```solidity
// src/BiometricRecoverySigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IExternalSigner} from "./interfaces/IExternalSigner.sol";
import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

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
    event FaceEnrolled(
        address indexed account,
        bytes32 indexed faceKeyHash,
        uint256 timestamp
    );

    /// @notice Emitted when a face enrollment is revoked
    event FaceRevoked(
        address indexed account,
        bytes32 indexed faceKeyHash,
        uint256 timestamp
    );

    /// @notice Emitted when recovery is executed
    event RecoveryExecuted(
        address indexed account,
        uint256 indexed nonce,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error OnlyAccountOwner();
    error InvalidLivenessProof();
    error InvalidFaceSignature();
    error NonceAlreadyUsed();
    error FaceNotEnrolled();
    error FaceAlreadyEnrolled();
    error InvalidProofLength();
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
    function enrollFace(
        bytes32 faceKeyHash,
        bytes calldata livenessProof
    ) external {
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
    function updateFace(
        bytes32 newFaceKeyHash,
        bytes calldata livenessProof
    ) external {
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
        (
            bytes memory livenessProof,
            bytes memory faceSignature,
            uint256 nonce
        ) = abi.decode(signature, (bytes, bytes, uint256));

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
        // Bionetta proof format: (uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[] publicInputs)
        if (proof.length < 256) {
            return false; // Minimum valid proof size
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
        (address recovered, ECDSA.RecoverError error, ) = digest.tryRecover(signature);
        
        if (error != ECDSA.RecoverError.NoError) {
            return false;
        }

        // Hash recovered address and compare to enrolled key hash
        bytes32 recoveredHash = keccak256(abi.encode(recovered));
        return recoveredHash == expectedKeyHash;
    }
}
```

---

## Step 4: Implement Groth16Verifier Interface

```solidity
// src/interfaces/IGroth16Verifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGroth16Verifier
/// @notice Interface for Bionetta ZK liveness proof verification
interface IGroth16Verifier {
    /// @notice Verify a Groth16 proof
    /// @param proof The serialized proof data
    /// @return isValid True if proof is valid
    function verifyProof(bytes calldata proof) external view returns (bool isValid);
}
```

---

## Step 5: Create Mock Verifier for Testing

```solidity
// src/test/mocks/MockGroth16Verifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGroth16Verifier} from "../../interfaces/IGroth16Verifier.sol";

/// @title MockGroth16Verifier
/// @notice Mock verifier for testing - accepts all proofs with magic prefix
/// @dev DO NOT USE IN PRODUCTION
contract MockGroth16Verifier is IGroth16Verifier {
    // Magic prefix for valid test proofs
    bytes4 public constant VALID_PROOF_PREFIX = 0xdeadbeef;
    
    // Toggle for testing invalid proof scenarios
    bool public alwaysReject;

    function setAlwaysReject(bool _reject) external {
        alwaysReject = _reject;
    }

    function verifyProof(bytes calldata proof) external view override returns (bool) {
        if (alwaysReject) return false;
        if (proof.length < 4) return false;
        
        // Check for magic prefix
        bytes4 prefix;
        assembly {
            prefix := calldataload(proof.offset)
        }
        return prefix == VALID_PROOF_PREFIX;
    }
    
    /// @notice Generate a valid mock proof for testing
    function generateValidProof() external pure returns (bytes memory) {
        // Return proof with valid prefix + padding
        return abi.encodePacked(VALID_PROOF_PREFIX, bytes28(0), bytes32(0), bytes32(0), bytes32(0), bytes32(0), bytes32(0), bytes32(0), bytes32(0));
    }
}
```

---

## Step 6: Comprehensive Test Suite

```solidity
// test/BiometricRecoverySigner.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {BiometricRecoverySigner} from "../src/BiometricRecoverySigner.sol";
import {MockGroth16Verifier} from "../src/test/mocks/MockGroth16Verifier.sol";

contract BiometricRecoverySignerTest is Test {
    BiometricRecoverySigner public signer;
    MockGroth16Verifier public verifier;

    address public alice;
    uint256 public alicePrivateKey;
    address public bob;
    uint256 public bobPrivateKey;
    address public attacker;

    bytes public validLivenessProof;
    bytes32 public aliceFaceKeyHash;

    event FaceEnrolled(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);
    event FaceRevoked(address indexed account, bytes32 indexed faceKeyHash, uint256 timestamp);
    event RecoveryExecuted(address indexed account, uint256 indexed nonce, uint256 timestamp);

    function setUp() public {
        // Create test accounts
        alicePrivateKey = 0xA11CE;
        alice = vm.addr(alicePrivateKey);
        bobPrivateKey = 0xB0B;
        bob = vm.addr(bobPrivateKey);
        attacker = makeAddr("attacker");

        // Deploy mock verifier and signer
        verifier = new MockGroth16Verifier();
        signer = new BiometricRecoverySigner(address(verifier));

        // Generate valid proof and face key hash
        validLivenessProof = verifier.generateValidProof();
        aliceFaceKeyHash = keccak256(abi.encode(alice));
    }

    /*//////////////////////////////////////////////////////////////
                           CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_constructor_setsVerifier() public view {
        assertEq(address(signer.livenessVerifier()), address(verifier));
    }

    function test_constructor_revertsOnZeroAddress() public {
        vm.expectRevert(BiometricRecoverySigner.ZeroAddress.selector);
        new BiometricRecoverySigner(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                           ENROLLMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_enrollFace_success() public {
        vm.prank(alice);
        
        vm.expectEmit(true, true, false, true);
        emit FaceEnrolled(alice, aliceFaceKeyHash, block.timestamp);
        
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        assertEq(signer.enrolledFaceKeyHashes(alice), aliceFaceKeyHash);
        assertEq(signer.enrollmentTimestamps(alice), block.timestamp);
        assertTrue(signer.isEnrolled(alice));
    }

    function test_enrollFace_revertsOnInvalidProof() public {
        bytes memory invalidProof = hex"00000000"; // Wrong prefix
        
        vm.prank(alice);
        vm.expectRevert(BiometricRecoverySigner.InvalidLivenessProof.selector);
        signer.enrollFace(aliceFaceKeyHash, invalidProof);
    }

    function test_enrollFace_revertsOnDoubleEnroll() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
        
        vm.expectRevert(BiometricRecoverySigner.FaceAlreadyEnrolled.selector);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
        vm.stopPrank();
    }

    function test_revokeFace_success() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
        
        vm.expectEmit(true, true, false, true);
        emit FaceRevoked(alice, aliceFaceKeyHash, block.timestamp);
        
        signer.revokeFace();
        vm.stopPrank();

        assertEq(signer.enrolledFaceKeyHashes(alice), bytes32(0));
        assertFalse(signer.isEnrolled(alice));
    }

    function test_revokeFace_revertsIfNotEnrolled() public {
        vm.prank(alice);
        vm.expectRevert(BiometricRecoverySigner.FaceNotEnrolled.selector);
        signer.revokeFace();
    }

    function test_updateFace_success() public {
        bytes32 newFaceKeyHash = keccak256(abi.encode(alice, "updated"));
        
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
        
        // Should emit both revoke and enroll
        vm.expectEmit(true, true, false, true);
        emit FaceRevoked(alice, aliceFaceKeyHash, block.timestamp);
        vm.expectEmit(true, true, false, true);
        emit FaceEnrolled(alice, newFaceKeyHash, block.timestamp);
        
        signer.updateFace(newFaceKeyHash, validLivenessProof);
        vm.stopPrank();

        assertEq(signer.enrolledFaceKeyHashes(alice), newFaceKeyHash);
    }

    /*//////////////////////////////////////////////////////////////
                     SIGNATURE VERIFICATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_isValidSignature_success() public {
        // Enroll alice's face
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        // Create digest and sign with alice's key (simulating face-derived key)
        bytes32 digest = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, digest);
        bytes memory faceSignature = abi.encodePacked(r, s, v);
        uint256 nonce = 1;

        // Pack signature for verification
        bytes memory packedSig = abi.encode(validLivenessProof, faceSignature, nonce);

        // Verify as alice (simulating Porto account calling)
        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(digest, packedSig, aliceFaceKeyHash);
        assertTrue(isValid);
    }

    function test_isValidSignature_failsWithWrongSigner() public {
        // Enroll alice's face
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        // Create digest and sign with BOB's key (wrong key)
        bytes32 digest = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(bobPrivateKey, digest);
        bytes memory faceSignature = abi.encodePacked(r, s, v);

        bytes memory packedSig = abi.encode(validLivenessProof, faceSignature, uint256(1));

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(digest, packedSig, aliceFaceKeyHash);
        assertFalse(isValid);
    }

    function test_isValidSignature_failsWithInvalidLiveness() public {
        // Enroll alice's face
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        bytes32 digest = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, digest);
        bytes memory faceSignature = abi.encodePacked(r, s, v);

        // Use invalid liveness proof
        bytes memory invalidProof = hex"00000000";
        bytes memory packedSig = abi.encode(invalidProof, faceSignature, uint256(1));

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(digest, packedSig, aliceFaceKeyHash);
        assertFalse(isValid);
    }

    function test_isValidSignature_failsWithReplayedNonce() public {
        // Enroll alice's face
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        // Consume nonce 1
        vm.prank(alice);
        signer.consumeNonce(1);

        bytes32 digest = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, digest);
        bytes memory faceSignature = abi.encodePacked(r, s, v);

        // Try to use nonce 1 again
        bytes memory packedSig = abi.encode(validLivenessProof, faceSignature, uint256(1));

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(digest, packedSig, aliceFaceKeyHash);
        assertFalse(isValid);
    }

    function test_isValidSignature_failsIfNotEnrolled() public {
        bytes32 digest = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, digest);
        bytes memory faceSignature = abi.encodePacked(r, s, v);
        bytes memory packedSig = abi.encode(validLivenessProof, faceSignature, uint256(1));

        vm.prank(alice);
        bool isValid = signer.isValidSignatureWithKeyHash(digest, packedSig, aliceFaceKeyHash);
        assertFalse(isValid);
    }

    /*//////////////////////////////////////////////////////////////
                             NONCE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_consumeNonce_success() public {
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit RecoveryExecuted(alice, 1, block.timestamp);
        signer.consumeNonce(1);

        assertEq(signer.recoveryNonces(alice), 1);
        assertEq(signer.getNextNonce(alice), 2);
    }

    function test_consumeNonce_revertsOnReplay() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
        signer.consumeNonce(1);
        
        vm.expectRevert(BiometricRecoverySigner.NonceAlreadyUsed.selector);
        signer.consumeNonce(1);
        vm.stopPrank();
    }

    function test_consumeNonce_allowsSkippingNonces() public {
        vm.startPrank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);
        
        // Skip to nonce 100
        signer.consumeNonce(100);
        assertEq(signer.recoveryNonces(alice), 100);
        
        // Can use 101
        signer.consumeNonce(101);
        assertEq(signer.recoveryNonces(alice), 101);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_enrollFace_anyKeyHash(bytes32 faceKeyHash) public {
        vm.prank(alice);
        signer.enrollFace(faceKeyHash, validLivenessProof);
        assertEq(signer.enrolledFaceKeyHashes(alice), faceKeyHash);
    }

    function testFuzz_nonce_monotonicallyIncreasing(uint256[] calldata nonces) public {
        vm.assume(nonces.length > 0 && nonces.length < 100);
        
        vm.prank(alice);
        signer.enrollFace(aliceFaceKeyHash, validLivenessProof);

        uint256 lastNonce = 0;
        for (uint256 i = 0; i < nonces.length; i++) {
            uint256 nonce = bound(nonces[i], lastNonce + 1, type(uint128).max);
            vm.prank(alice);
            signer.consumeNonce(nonce);
            lastNonce = nonce;
        }

        assertEq(signer.recoveryNonces(alice), lastNonce);
    }
}
```

---

## Step 7: Deployment Script

```solidity
// script/DeployRecovery.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BiometricRecoverySigner} from "../src/BiometricRecoverySigner.sol";
import {MockGroth16Verifier} from "../src/test/mocks/MockGroth16Verifier.sol";

contract DeployRecovery is Script {
    // Deployed contract addresses
    address public groth16Verifier;
    address public biometricSigner;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);

        // For testnet, deploy mock verifier
        // For mainnet, use real Bionetta verifier address
        if (block.chainid == 84532) { // Base Sepolia
            console2.log("Deploying to Base Sepolia (testnet)...");
            
            // Deploy mock verifier for testing
            MockGroth16Verifier mockVerifier = new MockGroth16Verifier();
            groth16Verifier = address(mockVerifier);
            console2.log("MockGroth16Verifier deployed to:", groth16Verifier);
            
        } else if (block.chainid == 8453) { // Base mainnet
            console2.log("Deploying to Base mainnet...");
            
            // Use real Bionetta verifier (must be deployed first)
            groth16Verifier = vm.envAddress("BIONETTA_VERIFIER_ADDRESS");
            require(groth16Verifier != address(0), "BIONETTA_VERIFIER_ADDRESS not set");
            console2.log("Using existing Groth16Verifier at:", groth16Verifier);
            
        } else {
            revert("Unsupported chain");
        }

        // Deploy BiometricRecoverySigner
        BiometricRecoverySigner signer = new BiometricRecoverySigner(groth16Verifier);
        biometricSigner = address(signer);
        console2.log("BiometricRecoverySigner deployed to:", biometricSigner);

        vm.stopBroadcast();

        // Output for saving to deployments file
        console2.log("\n=== DEPLOYMENT SUMMARY ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Groth16Verifier:", groth16Verifier);
        console2.log("BiometricRecoverySigner:", biometricSigner);
        console2.log("===========================\n");
    }
}
```

---

## Step 8: foundry.toml Configuration

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 200
via_ir = true
solc_version = "0.8.24"

[profile.default.fuzz]
runs = 256
max_test_rejects = 65536

[profile.default.invariant]
runs = 256
depth = 15

[rpc_endpoints]
base_sepolia = "${BASE_SEPOLIA_RPC_URL}"
base = "${BASE_RPC_URL}"

[etherscan]
base_sepolia = { key = "${BASESCAN_API_KEY}", url = "https://api-sepolia.basescan.org/api" }
base = { key = "${BASESCAN_API_KEY}", url = "https://api.basescan.org/api" }
```

---

## Step 9: Execute Deployment

### Testnet (Base Sepolia)

```bash
# 1. Load environment
source .env

# 2. Get testnet ETH from faucet
# Visit: https://www.alchemy.com/faucets/base-sepolia
# Send to your deployer address

# 3. Run tests first
forge test -vvv

# 4. Deploy to Base Sepolia
forge script script/DeployRecovery.s.sol:DeployRecovery \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv

# 5. Save deployment addresses
cat > deployments/84532.json << EOF
{
  "chainId": 84532,
  "chainName": "Base Sepolia",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {
    "Groth16Verifier": "<ADDRESS_FROM_OUTPUT>",
    "BiometricRecoverySigner": "<ADDRESS_FROM_OUTPUT>"
  },
  "verificationLinks": {
    "Groth16Verifier": "https://sepolia.basescan.org/address/<ADDRESS>#code",
    "BiometricRecoverySigner": "https://sepolia.basescan.org/address/<ADDRESS>#code"
  }
}
EOF
```

### Mainnet (Base) - After Testnet Validation

```bash
# Only run after testnet is validated!

forge script script/DeployRecovery.s.sol:DeployRecovery \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv

# Save deployment addresses
cat > deployments/8453.json << EOF
{
  "chainId": 8453,
  "chainName": "Base",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {
    "Groth16Verifier": "<ADDRESS_FROM_OUTPUT>",
    "BiometricRecoverySigner": "<ADDRESS_FROM_OUTPUT>"
  }
}
EOF
```

---

## Step 10: Key Management Checklist

Before deployment, verify:

- [ ] Created deployer wallet via `cast wallet new`
- [ ] Stored deployer key in 1Password: "Villa Deployer - All Chains"
- [ ] Created gas tank wallet for testnet: "Villa Gas Tank - Base Sepolia"
- [ ] Created gas tank wallet for mainnet: "Villa Gas Tank - Base Mainnet"
- [ ] Funded deployer with testnet ETH (0.1 ETH sufficient)
- [ ] Set GitHub secrets via `gh secret set`
- [ ] Set DO App Platform secrets via `doctl`
- [ ] Verified BASESCAN_API_KEY is valid

After deployment, verify:

- [ ] Contracts verified on Basescan
- [ ] Deployment addresses saved to `deployments/*.json`
- [ ] Integration tests pass against deployed contracts
- [ ] Merchant sponsoring works for recovery transactions

---

## Validation Criteria

Before promoting to mainnet:

1. **All tests pass**: `forge test -vvv` shows 100% passing
2. **Coverage > 80%**: `forge coverage` shows adequate coverage
3. **Gas benchmarks acceptable**: Enrollment < 200k gas, verification < 100k gas
4. **End-to-end flow works**: Enroll face, simulate recovery, verify signature
5. **Sponsoring works**: Merchant wallet successfully sponsors test transactions
6. **No critical findings**: Security review complete (even informal)

---

## Common Issues & Solutions

**"Execution reverted" on deployment**:
- Check deployer has sufficient ETH
- Verify RPC URL is correct
- Check contract constructor arguments

**"Contract not verified"**:
- Ensure BASESCAN_API_KEY is set
- Wait 30 seconds and retry verification
- Use `forge verify-contract` manually if needed

**"Nonce too low"**:
- Deployer may have pending transactions
- Use `cast nonce $DEPLOYER_ADDRESS --rpc-url $RPC_URL` to check
- Wait for pending txs or use higher nonce

**"Insufficient funds for gas"**:
- Fund deployer from faucet (testnet) or Coinbase (mainnet)
- Each deployment costs ~0.01-0.05 ETH

---

## Next Steps After Deployment

1. Update Villa spec with deployed addresses
2. Integrate with Porto account creation flow
3. Build face enrollment UI
4. Test end-to-end recovery flow
5. Set up balance monitoring for gas tanks
6. Document integration for SDK developers
