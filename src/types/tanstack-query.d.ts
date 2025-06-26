import "@tanstack/react-query";
// import { SearchClient } from "algoliasearch";

declare module "@tanstack/react-query" {
	interface QueryMeta {
		pageSize: number;
		order: "asc" | "desc";
		// search_client: SearchClient;
		// Add any other meta properties you expect
	}

	interface Register {
		queryMeta: QueryMeta;
		// If you use mutations and want meta for them:
		// mutationMeta: MutationMeta;
	}
}

export {};
