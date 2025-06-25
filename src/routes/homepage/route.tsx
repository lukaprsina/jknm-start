import { SearchClient, searchClient } from "@algolia/client-search";
import { infiniteQueryOptions, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import Layout from "~/components/layouts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const defaultValues = {
  filter: "",
  sort: "newest",
} as const;

// BRO sej sploh ne uporabiš Drizzle ORM, ampak samo Algolio
const infinite_posts_query = infiniteQueryOptions({
  queryKey: ["articles"],
  // initialPageParam: new Date(),
  initialPageParam: 0,
  queryFn: async ({ pageParam, meta }) => {
    const filter = meta!.filter as string;
    const pageSize = meta!.pageSize as number;
    // const order: "asc" | "desc" = meta!.order as "asc" | "desc";
    const search_client = meta!.search_client as SearchClient;

    /* console.log("Fetching articles with pagination", {
      pageParam,
      order,
      meta,
    }); */

    const data = await search_client.searchSingleIndex({
      indexName: "articles",
      searchParams: {
        query: filter,
        hitsPerPage: pageSize,
        page: pageParam || 0,
        // sortFacetValuesBy: order === "asc" ? "alpha" : "alpha_desc",
      },
    });

    /* const data = await db.query.Article.findMany({
      ...withCursorPagination({
        where: eq(Article.status, "published"),
        limit: meta.pageSize,
        cursors: [
          [Article.published_at, order, pageParam],
          // [Article.id, "asc", "94b5a795-5af4-40c3-8db8-a1c33906f5af"],
        ],
      }),
      with: {
        articles_to_authors: {
          with: { author: true },
          orderBy: asc(ArticlesToAuthors.order),
        },
      },
    }); */

    return {
      data,
      next_cursor: null,
      prev_cursor: null,
    };

    /* return {
      data,
      next_cursor: data.at(-1)?.created_at,
      prev_cursor: data.at(0)?.created_at,
    }; */
  },
  getNextPageParam: (lastPage) => lastPage.next_cursor,
  getPreviousPageParam: (firstPage) => firstPage.prev_cursor,
});

const productSearchSchema = z.object({
  filter: z.string().default(defaultValues.filter),
  sort: z.enum(["newest", "oldest", "price"]).default(defaultValues.sort),
});

export const Route = createFileRoute("/homepage")({
  validateSearch: zodValidator(productSearchSchema),
  search: {
    middlewares: [stripSearchParams(defaultValues)],
  },
  beforeLoad: async () => {
    const search_client = searchClient(
      process.env.ALGOLIA_APP_ID!,
      process.env.ALGOLIA_SEARCH_API_KEY!,
    );
    console.log("Search client initialized:", process.env.ALGOLIA_APP_ID);
    return { search_client };
  },
  loader: ({ context }) => {
    context.queryClient.ensureInfiniteQueryData({
      ...infinite_posts_query,
      meta: {
        pageSize: 10,
        order: "desc",
        search_client: context.search_client,
      },
    });
  },
  component: Homepage,
});

function Homepage() {
  const context = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    console.log("Search params:", search.filter, search.sort);
  }, [search.filter, search.sort]);

  const data = useSuspenseInfiniteQuery({
    ...infinite_posts_query,
    meta: {
      pageSize: 10,
      order: "desc",
      search_client: context.search_client,
    },
  });

  return (
    <Layout>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          Filters{" "}
          {showFilters ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </div>
      {showFilters && (
        <div className="mt-2">
          <Input
            placeholder="Search articles..."
            value={search.filter}
            onChange={(e) =>
              navigate({
                from: "/homepage",
                to: "/homepage",
                search: { filter: e.target.value },
              })
            }
          />
        </div>
      )}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Layout>
  );
}
