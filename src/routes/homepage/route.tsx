// import { SearchClient, searchClient } from "@algolia/client-search";
import {
	infiniteQueryOptions,
	useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
// import { SearchClient, algoliasearch } from "algoliasearch";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import Layout from "~/components/layouts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { search_client } from "~/lib/algolia";

const defaultValues = {
	filter: "",
	sort: "newest",
} as const;

const infinite_posts_query = infiniteQueryOptions({
	// TODO: this should have pageParam, filter, sort in it
	queryKey: ["articles"],
	// initialPageParam: new Date(),
	initialPageParam: 0,
	queryFn: async ({ pageParam, meta }) => {
		const filter = meta!.filter as string;
		const pageSize = meta!.pageSize as number;

		const data = await search_client.searchSingleIndex({
			indexName: "articles",
			searchParams: {
				query: filter,
				hitsPerPage: pageSize,
				page: pageParam || 0,
				// sortFacetValuesBy: order === "asc" ? "alpha" : "alpha_desc",
			},
		});

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
	loaderDeps: ({ search: { filter, sort } }) => ({
		filter,
		sort,
	}),
	loader: ({ context }) => {
		context.queryClient.ensureInfiniteQueryData({
			...infinite_posts_query,
			meta: {
				pageSize: 30,
				order: "desc",
			},
		});
	},
	component: Homepage,
});

function Homepage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
		console.log("Search params:", search.filter, search.sort);
	}, [search.filter, search.sort]);

	const data = useSuspenseInfiniteQuery({
		...infinite_posts_query,
		meta: {
			pageSize: 30,
			order: "desc",
		},
	});

	return (
		<Layout>
			<div className="flex items-center space-x-2">
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
