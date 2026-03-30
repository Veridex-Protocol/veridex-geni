access(all) contract FrontierMissionHandler {
  access(all) event MissionExecuted(missionId: String, outcomeHash: String)

  access(all) fun emitExecutionReceipt(missionId: String, outcomeHash: String) {
    emit MissionExecuted(missionId: missionId, outcomeHash: outcomeHash)
  }
}
