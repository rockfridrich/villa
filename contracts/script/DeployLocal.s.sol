// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { BiometricRecoverySigner } from "../src/BiometricRecoverySigner.sol";
import { MockGroth16Verifier } from "../src/mocks/MockGroth16Verifier.sol";

/// @title DeployLocal
/// @notice Deploy contracts to local Anvil for development
contract DeployLocal is Script {
    function run() public {
        // Use Anvil's default account (index 0)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock verifier
        MockGroth16Verifier verifier = new MockGroth16Verifier();
        console2.log("MockGroth16Verifier deployed to:", address(verifier));

        // Deploy biometric signer
        BiometricRecoverySigner signer = new BiometricRecoverySigner(address(verifier));
        console2.log("BiometricRecoverySigner deployed to:", address(signer));

        vm.stopBroadcast();

        // Output JSON for frontend integration
        console2.log("");
        console2.log("=== DEPLOYMENT SUMMARY ===");
        console2.log("Copy these addresses to contracts/deployments/local.json:");
        console2.log("");
        console2.log("{");
        console2.log('  "chainId": 31337,');
        console2.log('  "MockGroth16Verifier": "%s",', address(verifier));
        console2.log('  "BiometricRecoverySigner": "%s"', address(signer));
        console2.log("}");
        console2.log("===========================");
    }
}
