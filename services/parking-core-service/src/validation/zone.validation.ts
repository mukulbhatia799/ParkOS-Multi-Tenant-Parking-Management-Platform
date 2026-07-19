import { z } from "zod";
import { ZoneType } from "@parking/shared";

export const createZoneSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(ZoneType),
  parentZoneId: z.string().nullable().optional(),
  graphNode: z.object({ x: z.number(), y: z.number(), floor: z.number() }).optional(),
  connections: z
    .array(
      z.object({
        zoneId: z.string(),
        distance: z.number().positive().default(1),
        edgeType: z.enum(["walkway", "ramp", "elevator"]).default("walkway"),
      })
    )
    .optional(),
});

export const updateZoneSchema = createZoneSchema.partial();
