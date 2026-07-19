import { z } from "zod";

export const scanSchema = z.object({
  image: z.string().min(100),
});
