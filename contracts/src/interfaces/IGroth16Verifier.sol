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
