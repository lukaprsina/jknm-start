import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/editor/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Loading Editor...</div>;
}
