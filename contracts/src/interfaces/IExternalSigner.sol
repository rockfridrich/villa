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
