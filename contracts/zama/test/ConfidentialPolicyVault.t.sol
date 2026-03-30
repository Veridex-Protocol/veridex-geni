// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConfidentialPolicyVault} from "../src/ConfidentialPolicyVault.sol";

contract ConfidentialPolicyVaultTest is Test {
    function testStorePolicy() external {
        ConfidentialPolicyVault vault = new ConfidentialPolicyVault();
        string[] memory fields = new string[](2);
        fields[0] = "maxSpendUsd";
        fields[1] = "minTrustScore";

        vault.storePolicy(bytes32("mission"), bytes32("policy"), bytes32("acl"), fields);

        (bytes32 policyHandle, bytes32 aclGrantId, bool active) = vault.policies(bytes32("mission"));
        assertEq(policyHandle, bytes32("policy"));
        assertEq(aclGrantId, bytes32("acl"));
        assertTrue(active);
    }
}
