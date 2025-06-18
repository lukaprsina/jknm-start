import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/editor/")({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      if (location.pathname !== "/login") {
        // Prevent infinite redirect loop
        throw redirect({
          to: "/login",
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
  component: RouteComponent,
});

async function RouteComponent() {
  return (
    <>
      <Outlet />
      Loading from RouteComponent...
    </>
  );
}
