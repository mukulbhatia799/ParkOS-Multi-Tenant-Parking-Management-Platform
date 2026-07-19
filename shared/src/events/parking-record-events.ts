import { VehicleType } from "../types/enums";

export interface ParkingRecordEntryDetectedPayload {
  recordId: string;
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
  vehicleId: string;
  licensePlate: string;
  vehicleType: VehicleType;
  entryTime: string;
}

export interface ParkingRecordExitDetectedPayload {
  recordId: string;
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
  vehicleId: string;
  licensePlate: string;
  exitTime: string;
  durationMinutes: number;
}

export interface VehicleRegisteredPayload {
  vehicleId: string;
  clientId: string;
  licensePlate: string;
  type: VehicleType;
}
