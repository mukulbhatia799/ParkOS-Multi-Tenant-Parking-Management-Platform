import { SlotStatus, SlotType } from "./enums";

export interface ParkingSlot {
  _id: string;
  clientId: string;
  lotId: string;
  zoneId: string;
  slotNumber: string;
  type: SlotType;
  status: SlotStatus;
  currentRecordId?: string | null;
  position?: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}
