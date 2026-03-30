import FrontierMissionScheduler from 0xFrontier

access(all) fun main(missionId: String): FrontierMissionScheduler.ScheduleReceipt? {
  return FrontierMissionScheduler.getSchedule(missionId: missionId)
}
