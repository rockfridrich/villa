// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { VillaNicknameResolverV2 } from "../src/VillaNicknameResolverV2.sol";

/**
 * @title ConfigureGateway
 * @notice Sets the CCIP-Read gateway URL on VillaNicknameResolverV2
 * @dev Run with: forge script script/ConfigureGateway.s.sol --rpc-url base-sepolia --broadcast
 */
contract ConfigureGateway is Script {
    // Base Sepolia deployment
    address constant RESOLVER_PROXY = 0xf4648423aC6b3f6328018c49B2102f4E9bA6D800;

    // Gateway URL for CCIP-Read resolution
    string constant GATEWAY_URL = "https://beta.villa.cash/api/ens/resolve";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console2.log("Configuring VillaNicknameResolverV2 gateway...");
        console2.log("Proxy address:", RESOLVER_PROXY);
        console2.log("Gateway URL:", GATEWAY_URL);

        vm.startBroadcast(deployerPrivateKey);

        VillaNicknameResolverV2 resolver = VillaNicknameResolverV2(RESOLVER_PROXY);

        // Check current URL
        string memory currentUrl = resolver.url();
        console2.log("Current URL:", currentUrl);

        // Set new URL
        resolver.setUrl(GATEWAY_URL);

        // Verify
        string memory newUrl = resolver.url();
        console2.log("New URL:", newUrl);

        vm.stopBroadcast();

        console2.log("Gateway configured successfully!");
    }
}
