access(all) contract FrontierMissionScheduler {
  access(all) struct ScheduleReceipt {
    access(all) let missionId: String
    access(all) let cadence: String
    access(all) let scheduledFor: UFix64
    access(all) let retryPolicy: String
    access(all) let createdAt: UFix64

    init(
      missionId: String,
      cadence: String,
      scheduledFor: UFix64,
      retryPolicy: String,
      createdAt: UFix64
    ) {
      self.missionId = missionId
      self.cadence = cadence
      self.scheduledFor = scheduledFor
      self.retryPolicy = retryPolicy
      self.createdAt = createdAt
    }
  }

  access(all) event MissionScheduled(missionId: String, cadence: String, scheduledFor: UFix64)

  access(self) var schedules: {String: ScheduleReceipt}

  init() {
    self.schedules = {}
  }

  access(all) fun scheduleMission(
    missionId: String,
    cadence: String,
    scheduledFor: UFix64,
    retryPolicy: String
  ) {
    let receipt = ScheduleReceipt(
      missionId: missionId,
      cadence: cadence,
      scheduledFor: scheduledFor,
      retryPolicy: retryPolicy,
      createdAt: getCurrentBlock().timestamp
    )
    self.schedules[missionId] = receipt
    emit MissionScheduled(missionId: missionId, cadence: cadence, scheduledFor: scheduledFor)
  }

  access(all) fun getSchedule(missionId: String): ScheduleReceipt? {
    return self.schedules[missionId]
  }
}
