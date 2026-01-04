// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { BiometricRecoverySigner } from "../src/BiometricRecoverySigner.sol";

/// @title Deploy
/// @notice Deploy contracts to Base (production or testnet)
/// @dev Requires DEPLOYER_PRIVATE_KEY and GROTH16_VERIFIER_ADDRESS env vars
contract Deploy is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address verifier = vm.envAddress("GROTH16_VERIFIER_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== DEPLOYMENT CONFIG ===");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Groth16 Verifier:", verifier);
        console2.log("");

        // Validate verifier address
        require(verifier != address(0), "GROTH16_VERIFIER_ADDRESS not set or invalid");
        require(verifier.code.length > 0, "Verifier address has no code");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BiometricRecoverySigner
        BiometricRecoverySigner signer = new BiometricRecoverySigner(verifier);
        console2.log("BiometricRecoverySigner deployed to:", address(signer));

        vm.stopBroadcast();

        // Output deployment summary
        console2.log("");
        console2.log("=== DEPLOYMENT SUMMARY ===");
        console2.log("Save to contracts/deployments/%s.json:", block.chainid);
        console2.log("");
        console2.log("{");
        console2.log('  "chainId": %s,', vm.toString(block.chainid));
        console2.log('  "network": "%s",', _getNetworkName(block.chainid));
        console2.log('  "deployer": "%s",', deployer);
        console2.log('  "timestamp": %s,', block.timestamp);
        console2.log('  "contracts": {');
        console2.log('    "Groth16Verifier": "%s",', verifier);
        console2.log('    "BiometricRecoverySigner": "%s"', address(signer));
        console2.log("  }");
        console2.log("}");
        console2.log("===========================");
    }

    /// @dev Get human-readable network name from chain ID
    function _getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 8453) return "base";
        if (chainId == 84532) return "base-sepolia";
        if (chainId == 31337) return "anvil";
        return "unknown";
    }
}
