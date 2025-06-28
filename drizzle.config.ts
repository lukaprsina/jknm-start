import type { Config } from "drizzle-kit";
import { Resource } from "sst";

export default {
  out: "./drizzle",
  schema: "./src/lib/db/schema/index.ts",
  breakpoints: true,
  verbose: true,
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: Resource.DirectUrl.value, // changed from DATABASE_URL
  },
} satisfies Config;
