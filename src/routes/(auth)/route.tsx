import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const REDIRECT_URL = "/dashboard";
    if (context.user) {
      throw redirect({
        to: REDIRECT_URL,
      });
    }
    return {
      redirectUrl: REDIRECT_URL,
      user: context.user,
    };
  },
});

function RouteComponent() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Outlet />
      </div>
    </div>
  );
}
