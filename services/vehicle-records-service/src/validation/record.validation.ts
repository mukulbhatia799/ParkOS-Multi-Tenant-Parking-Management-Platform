import { z } from "zod";
import { VehicleType } from "@parking/shared";

export const createEntrySchema = z.object({
  lotId: z.string().min(1),
  slotId: z.string().min(1),
  licensePlate: z.string().min(1),
  vehicleType: z.nativeEnum(VehicleType).optional(),
});
