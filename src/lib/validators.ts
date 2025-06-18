import { z } from "zod/v4";

export const thumbnail_validator = z.object({
  image_url: z.string(),
  uploaded_custom_thumbnail: z.boolean().optional(),
  // unit: z.enum(["%", "px"]),
  unit: z.enum(["%"]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type ThumbnailType = z.infer<typeof thumbnail_validator>;
