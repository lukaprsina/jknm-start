import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(static)/zgodovina")({
	component: () => <p>Zgodovina</p>,
});
