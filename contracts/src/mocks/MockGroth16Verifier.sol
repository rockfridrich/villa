// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IGroth16Verifier } from "../interfaces/IGroth16Verifier.sol";

/// @title MockGroth16Verifier
/// @notice Mock verifier for testing - accepts all proofs with magic prefix
/// @dev DO NOT USE IN PRODUCTION
contract MockGroth16Verifier is IGroth16Verifier {
    /// @notice Magic prefix for valid test proofs
    bytes4 public constant VALID_PROOF_PREFIX = 0xdeadbeef;

    /// @notice Toggle for testing invalid proof scenarios
    bool public alwaysReject;

    /// @notice Set whether to always reject proofs (for testing)
    function setAlwaysReject(bool _reject) external {
        alwaysReject = _reject;
    }

    /// @notice Verify a proof - accepts proofs starting with magic prefix
    function verifyProof(bytes calldata proof) external view override returns (bool) {
        if (alwaysReject) return false;
        if (proof.length < 4) return false;

        // Check for magic prefix
        bytes4 prefix = bytes4(proof[:4]);
        return prefix == VALID_PROOF_PREFIX;
    }

    /// @notice Generate a valid mock proof for testing
    /// @return A proof that will pass verification
    function generateValidProof() external pure returns (bytes memory) {
        // Return proof with valid prefix + padding to make it 256 bytes
        bytes memory proof = new bytes(256);
        proof[0] = 0xde;
        proof[1] = 0xad;
        proof[2] = 0xbe;
        proof[3] = 0xef;
        return proof;
    }
}
