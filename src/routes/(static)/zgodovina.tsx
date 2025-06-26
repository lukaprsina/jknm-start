import { createFileRoute } from "@tanstack/react-router";
import { PostContent } from "~/components/post-content";

export const Route = createFileRoute("/(static)/zgodovina")({
	component: () => <PostContent slug="zgodovina" isStaticPage={true} />,
});
