/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	ScriptOnce,
	Scripts,
} from "@tanstack/react-router";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { getUser } from "~/lib/auth/functions/getUser";
import appCss from "~/styles.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	user: Awaited<ReturnType<typeof getUser>>;
}>()({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.fetchQuery({
			queryKey: ["user"],
			queryFn: ({ signal }) => getUser({ signal }),
		}); // we're using react-query for caching, see router.tsx
		return { user };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Jamarski klub Novo mesto",
			},
			{
				name: "description",
				content:
					"Specialisti za dokumentirano raziskovanje in ohranjanje čistega ter zdravega podzemskega sveta.",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				//https://www.algolia.com/doc/guides/building-search-ui/going-further/improve-performance/react/#prepare-the-connection-to-algolia
				rel: "preconnect",
				crossOrigin: "anonymous",
				href: `https://${process.env.VITE_ALGOLIA_APP_ID!}-dsn.algolia.net`,
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			{/* <EditorPreloader /> */}
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
	return (
		// suppress since we're updating the "dark" class in a custom script below
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ScriptOnce>
					{`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
				</ScriptOnce>

				{children}

				<ReactQueryDevtools buttonPosition="bottom-left" />
				<TanStackRouterDevtools position="bottom-right" />

				<Scripts />
			</body>
		</html>
	);
}
