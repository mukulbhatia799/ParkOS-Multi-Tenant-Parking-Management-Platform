import { z } from "zod";
import { SlotStatus, SlotType } from "@parking/shared";

export const createSlotSchema = z.object({
  zoneId: z.string(),
  slotNumber: z.string().min(1),
  type: z.nativeEnum(SlotType).default(SlotType.REGULAR),
  status: z.nativeEnum(SlotStatus).default(SlotStatus.AVAILABLE),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const bulkCreateSlotsSchema = z.object({
  slots: z.array(createSlotSchema).min(1),
});

export const updateSlotSchema = z.object({
  zoneId: z.string().optional(),
  slotNumber: z.string().min(1).optional(),
  type: z.nativeEnum(SlotType).optional(),
  status: z.nativeEnum(SlotStatus).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
