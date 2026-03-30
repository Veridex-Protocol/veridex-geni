import FrontierMissionScheduler from 0xFrontier

transaction(missionId: String, cadence: String, scheduledFor: UFix64, retryPolicy: String) {
  prepare(signer: auth(BorrowValue) &Account) {
    FrontierMissionScheduler.scheduleMission(
      missionId: missionId,
      cadence: cadence,
      scheduledFor: scheduledFor,
      retryPolicy: retryPolicy
    )
  }
}
