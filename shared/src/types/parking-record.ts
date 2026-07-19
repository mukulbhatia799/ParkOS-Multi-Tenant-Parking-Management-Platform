import { ParkingRecordStatus, VehicleType } from "./enums";

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
  createdAt: string;
  updatedAt: string;
}
