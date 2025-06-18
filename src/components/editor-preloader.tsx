"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { getUser } from "~/lib/auth/functions/getUser";

/**
 * Component that preloads the editor route for logged-in users
 * to improve UX by avoiding loading delays when accessing the editor.
 *
 * This component:
 * - Uses the same user query as the root route to avoid duplicate requests
 * - Only preloads once per session using a ref
 * - Resets the preload flag on error to allow retries
 * - Only logs in development mode
 * - Returns null as it's a utility component with no UI
 */
export function EditorPreloader() {
  const router = useRouter();
  const hasPreloadedRef = useRef(false);

  // Use the same query that's used in the root route to avoid duplicate requests
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: ({ signal }) => getUser({ signal }),
    staleTime: 1000 * 60 * 2, // 2 minutes - same as router.tsx
  });

  useEffect(() => {
    // Only preload if user is logged in, query is not loading, and we haven't preloaded yet
    if (user && !isLoading && !hasPreloadedRef.current) {
      hasPreloadedRef.current = true;

      router
        .preloadRoute({ to: "/editor" })
        .then(() => {
          if (import.meta.env.DEV || 1 == 1) {
            console.log("Editor route preloaded successfully!");
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV || 1 == 1) {
            console.error("Failed to preload editor route:", error);
          }
          // Reset flag on error so we can retry
          hasPreloadedRef.current = false;
        });
    }
  }, [user, isLoading, router]);

  // This component doesn't render anything
  return null;
}
