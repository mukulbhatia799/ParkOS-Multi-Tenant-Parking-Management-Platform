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

export interface AuthUser {
  sub: string;
  clientId: string | null;
  role: Role;
  assignedLotIds?: string[];
  email: string;
}

export type UserStatus = "invited" | "active" | "disabled";

export interface AppUser {
  _id: string;
  clientId: string | null;
  name: string;
  email: string;
  role: Role;
  assignedLotIds: string[];
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.CLIENT_ADMIN]: "Admin",
  [Role.OPERATOR]: "User",
};

export interface ParkingLot {
  _id: string;
  clientId: string;
  name: string;
  totalCapacity: number;
  status: "active" | "inactive";
}

export interface ParkingSlot {
  _id: string;
  clientId: string;
  lotId: string;
  zoneId: string;
  slotNumber: string;
  type: SlotType;
  status: SlotStatus;
}

export interface SlotStatusChangedPayload {
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
  type: SlotType;
  previousStatus: SlotStatus;
  status: SlotStatus;
}

export enum VehicleType {
  CAR = "car",
  BIKE = "bike",
  TRUCK = "truck",
  EV = "ev",
}

export enum ParkingRecordStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
}

export interface Vehicle {
  _id: string;
  clientId: string;
  licensePlate: string;
  type: VehicleType;
  ownerName?: string;
  ownerContact?: string;
}

export interface ParkingRecord {
  _id: string;
  clientId: string;
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
  vehicleId: string;
  licensePlate: string;
  vehicleType: VehicleType;
  status: ParkingRecordStatus;
  entryTime: string;
  exitTime?: string | null;
  durationMinutes?: number | null;
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

export interface Camera {
  _id: string;
  clientId: string;
  lotId: string;
  name: string;
  cameraType: CameraType;
  status: CameraStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DetectionLog {
  _id: string;
  clientId: string;
  cameraId: string;
  lotId: string;
  cameraType: CameraType;
  licensePlate: string;
  confidence: number;
  capturedAt: string;
  status: DetectionStatus;
  createdAt: string;
}

export interface ScanResult {
  detected: boolean;
  detection?: DetectionLog;
}

export interface PricingRule {
  _id: string;
  clientId: string;
  lotId: string;
  name: string;
  ratePerHour: number;
  currency: string;
  gracePeriodMinutes: number;
  maxDailyCharge?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingRecord {
  _id: string;
  clientId: string;
  parkingRecordId: string;
  lotId: string;
  licensePlate: string;
  durationMinutes: number;
  amountDue: number;
  currency: string;
  pricingRuleId?: string;
  calculatedAt: string;
  createdAt: string;
}

export interface FeeCalculatedPayload {
  billingRecordId: string;
  parkingRecordId: string;
  lotId: string;
  licensePlate: string;
  durationMinutes: number;
  amountDue: number;
  currency: string;
}

export interface VehicleLocateResult {
  vehicle: Vehicle;
  parked: boolean;
  location?: {
    lotId: string;
    zoneId: string;
    slotId: string;
    slotNumber: string;
    entryTime: string;
  };
  recordId?: string;
}

// ── Parking Lot Map ────────────────────────────────────────────────────────────

export type CellType = "slot" | "lane" | "entry" | "exit" | "wall";
export type SlotCellType = "regular" | "ev" | "vip" | "disabled";
export type Direction = "top" | "bottom" | "left" | "right";

export interface MapCell {
  row: number;
  col: number;
  type: CellType;
  slotType?: SlotCellType;
  slotId?: string;      // explicit FK → ParkingSlot._id; set via slot picker in Map Builder
  slotNumber?: string;  // display label; auto-filled from slotId selection
  label?: string;
  zoneColor?: string;
}

export interface NavigationStep {
  zoneId: string;
  zoneName: string;
  edgeType?: "walkway" | "ramp" | "elevator";
  distance?: number;
  cumulativeDistance: number;
}

export interface AssignSlotResult {
  slot: ParkingSlot;
}

export interface LevelMeta {
  level: number;
  levelName?: string;
  cellCount: number;
}

export interface LotMapData {
  level: number;
  levelName?: string;
  cells: MapCell[];
}
