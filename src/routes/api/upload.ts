import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/upload").methods({
  POST: async ({ request }) => {
    const body = await request.json();
    return new Response(JSON.stringify({ message: `Hello, ${body.name}!` }));
  },
});
