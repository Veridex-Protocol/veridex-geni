// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ConfidentialPolicyVault {
    struct PolicyRecord {
        bytes32 policyHandle;
        bytes32 aclGrantId;
        string[] encryptedFields;
        bool active;
    }

    mapping(bytes32 => PolicyRecord) public policies;

    event PolicyStored(bytes32 indexed missionKey, bytes32 indexed policyHandle, bytes32 aclGrantId);

    function storePolicy(
        bytes32 missionKey,
        bytes32 policyHandle,
        bytes32 aclGrantId,
        string[] calldata encryptedFields
    ) external {
        policies[missionKey] = PolicyRecord({
            policyHandle: policyHandle,
            aclGrantId: aclGrantId,
            encryptedFields: encryptedFields,
            active: true
        });

        emit PolicyStored(missionKey, policyHandle, aclGrantId);
    }
}
