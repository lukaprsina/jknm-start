import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { history } from "instantsearch.js/es/lib/routers";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { InstantSearchProps } from "react-instantsearch";
import { Configure, InfiniteHits, InstantSearch, SearchBox } from "react-instantsearch";
import Layout from "~/components/layouts";
import { Button } from "~/components/ui/button";
import { search_client } from "~/lib/algolia";

// This is the bridge between Algolia's state and TanStack Router's state
function TanStackRouter(route: ReturnType<(typeof Route)["useRouteContext"]>) {
  const navigate = useNavigate({ from: route.id });
  const search = useSearch({ from: route.id });
  // RouterProps

  return useMemo<InstantSearchProps["routing"]>(() => {
    return {
      ...history({ cleanUrlOnDispose: true }),
      createURL(routeState) {
        // This function is not strictly necessary for basic functionality
        // but is good practice to implement. It creates a URL from the state.
        const { origin, pathname } = window.location;
        const searchParams = new URLSearchParams(routeState);
        return `${origin}${pathname}?${searchParams.toString()}`;
      },
      read() {
        // Reads the search state from the URL's search params
        return search;
      },
      write(routeState) {
        // Writes the Algolia state to the URL using TanStack Router's navigate
        navigate({
          // `as any` is used here because Algolia's state might not
          // perfectly match the validated schema at all times.
          search: routeState,
          // Use replace to avoid polluting browser history on every keystroke
          replace: true,
        });
      },
      // Subscribe and unsubscribe are for handling browser back/forward events
      subscribe(onUpdate) {
        const subscriber = () => onUpdate(this.read());
        window.addEventListener("popstate", subscriber);
        return () => {
          window.removeEventListener("popstate", subscriber);
        };
      },
    };
  }, [navigate, search]);
}

// Your route definition remains largely the same, but no loader is needed
// as react-instantsearch will handle data fetching.
export const Route = createFileRoute("/home2")({
  // You can still validate search params if you want.
  // validateSearch: productSearchSchema,
  component: Homepage,
});

function Hit({ hit }: { hit: any }) {
  // This is your component for rendering a single search result
  return (
    <article>
      <p>{hit.title}</p>
      {/* Render other properties of your article */}
    </article>
  );
}

function Homepage() {
  const [showFilters, setShowFilters] = useState(false);
  const route = Route.useRouteContext();

  // Initialize the custom router
  const routing = TanStackRouter(route);

  return (
    <Layout>
      <InstantSearch
        future={{ preserveSharedStateOnUnmount: true }}
        searchClient={search_client}
        indexName="articles"
        routing={routing}
      >
        {/* The Configure component sets search parameters that are not controlled by widgets */}
        <Configure hitsPerPage={30} />

        <div className="flex items-center space-x-2">
          <SearchBox
            placeholder="Search articles..."
            className="flex-grow" // Example of styling the widget
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters{" "}
            {showFilters ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>

        {/* You can place other Algolia widgets like RefinementList here */}
        {showFilters && (
          <div className="mt-2">
            {/* For example: <RefinementList attribute="categories" /> */}
          </div>
        )}

        {/* InfiniteHits handles the fetching and rendering of results */}
        <InfiniteHits hitComponent={Hit} />
      </InstantSearch>
    </Layout>
  );
}
