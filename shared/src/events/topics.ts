export const Topics = {
  SLOT_STATUS_CHANGED: "slot.statusChanged",
  SLOT_ASSIGNED: "slot.assigned",
  SLOT_RELEASED: "slot.released",

  // reserved for later chunks
  PARKING_RECORD_ENTRY_DETECTED: "parkingRecord.entryDetected",
  PARKING_RECORD_EXIT_DETECTED: "parkingRecord.exitDetected",
  VEHICLE_REGISTERED: "vehicle.registered",
  CV_PLATE_DETECTED: "cv.plateDetected",
  FEE_CALCULATED: "fee.calculated",
  EV_SESSION_STARTED: "evCharging.sessionStarted",
  EV_SESSION_ENDED: "evCharging.sessionEnded",
  ALERT_RAISED: "alert.raised",
  CLIENT_CREATED: "client.created",
  USER_CREATED: "user.created",
} as const;

export type TopicName = (typeof Topics)[keyof typeof Topics];
