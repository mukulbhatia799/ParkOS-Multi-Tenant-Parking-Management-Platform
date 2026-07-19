import { z } from "zod";
import { VehicleType } from "@parking/shared";

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(1),
  type: z.nativeEnum(VehicleType).default(VehicleType.CAR),
  ownerName: z.string().optional(),
  ownerContact: z.string().optional(),
});
