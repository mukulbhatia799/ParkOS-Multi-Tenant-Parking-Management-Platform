import { SlotStatus, SlotType } from "../types/enums";

export interface SlotStatusChangedPayload {
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
  type: SlotType;
  previousStatus: SlotStatus;
  status: SlotStatus;
}

export interface SlotAssignedPayload {
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
  recordId?: string;
}

export interface SlotReleasedPayload {
  lotId: string;
  zoneId: string;
  slotId: string;
  slotNumber: string;
}
