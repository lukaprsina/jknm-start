import { serverOnly } from "@tanstack/react-start";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Resource } from "sst";

import * as schema from "~/lib/db/schema";

const driver = postgres(Resource.DatabaseUrl.value);

const getDatabase = serverOnly(() =>
	drizzle({ client: driver, schema, casing: "snake_case" }),
);

export const db = getDatabase();
