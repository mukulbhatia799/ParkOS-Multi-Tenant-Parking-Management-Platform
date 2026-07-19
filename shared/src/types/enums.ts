export enum Role {
  SUPER_ADMIN = "super_admin",
  CLIENT_ADMIN = "client_admin",
  OPERATOR = "operator",
}

export enum SlotType {
  REGULAR = "regular",
  VIP = "vip",
  EV = "ev",
  DISABLED = "disabled",
  RESERVED = "reserved",
}

export enum SlotStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
  OUT_OF_SERVICE = "out_of_service",
}

export enum VehicleType {
  CAR = "car",
  BIKE = "bike",
  TRUCK = "truck",
  EV = "ev",
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum ZoneType {
  LEVEL = "level",
  SECTION = "section",
  ENTRANCE = "entrance",
  EXIT = "exit",
  PATHWAY_NODE = "pathway_node",
}

export enum ClientStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
}

export enum SubscriptionPlan {
  TRIAL = "trial",
  BASIC = "basic",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export enum ParkingRecordStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
}

export enum CameraType {
  ENTRY = "entry",
  EXIT = "exit",
}

export enum CameraStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum DetectionStatus {
  PUBLISHED = "published",
  IGNORED = "ignored",
}
