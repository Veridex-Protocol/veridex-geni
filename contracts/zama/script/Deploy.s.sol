// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ConfidentialPolicyVault} from "../src/ConfidentialPolicyVault.sol";
import {ConfidentialRailExecutor} from "../src/ConfidentialRailExecutor.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        ConfidentialPolicyVault vault = new ConfidentialPolicyVault();
        new ConfidentialRailExecutor(address(vault));
        vm.stopBroadcast();
    }
}
