// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { BiometricRecoverySigner } from "../src/BiometricRecoverySigner.sol";
import { MockGroth16Verifier } from "../src/mocks/MockGroth16Verifier.sol";

contract BiometricRecoverySignerTest is Test {
    BiometricRecoverySigner public signer;
    MockGroth16Verifier public verifier;

    address public alice;
    uint256 public alicePrivateKey;
    address public bob;
    uint256 public bobPrivateKey;

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
}
