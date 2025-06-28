import { serverOnly } from "@tanstack/react-start";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";
import { Resource } from "sst";

import { db } from "~/lib/db";

const getAuthConfig = serverOnly(() =>
	betterAuth({
		baseURL: import.meta.env.VITE_BASE_URL,
		database: drizzleAdapter(db, {
			provider: "pg",
		}),

		// https://www.better-auth.com/docs/integrations/tanstack#usage-tips
		plugins: [reactStartCookies()],

		// https://www.better-auth.com/docs/concepts/session-management#session-caching
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
		},

		// https://www.better-auth.com/docs/concepts/oauth
		socialProviders: {
			google: {
				clientId: Resource.GoogleClientId.value,
				clientSecret: Resource.GoogleClientSecret.value,
			},
		},

		// https://www.better-auth.com/docs/authentication/email-password
		// emailAndPassword: {
		//   enabled: true,
		// },
	}),
);

export const auth = getAuthConfig();
