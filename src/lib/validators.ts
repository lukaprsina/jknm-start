import { z } from "zod/v4";

export const thumbnail_validator = z.object({
  image_url: z.url(),
  uploaded_custom_thumbnail: z.boolean(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
});

export type ThumbnailType = z.infer<typeof thumbnail_validator>;
