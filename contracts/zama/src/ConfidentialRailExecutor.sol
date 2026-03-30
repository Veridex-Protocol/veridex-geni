// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IConfidentialPolicyVault {
    function policies(bytes32 missionKey)
        external
        view
        returns (bytes32 policyHandle, bytes32 aclGrantId, bool active);
}

contract ConfidentialRailExecutor {
    IConfidentialPolicyVault public immutable vault;

    event ConfidentialExecutionEvaluated(bytes32 indexed missionKey, bool allowed, bytes32 decisionHash);

    constructor(address vaultAddress) {
        vault = IConfidentialPolicyVault(vaultAddress);
    }

    function evaluateMission(bytes32 missionKey, bytes32 decisionHash, bool allowed) external {
        (, , bool active) = vault.policies(missionKey);
        require(active, "policy inactive");
        emit ConfidentialExecutionEvaluated(missionKey, allowed, decisionHash);
    }
}
