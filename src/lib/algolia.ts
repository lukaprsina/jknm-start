import { searchClient } from "@algolia/client-search";
import { Resource } from "sst";

const appId = Resource.AlgoliaAppId.value;
const apiKey = Resource.AlgoliaAdminApiKey.value;

if (!appId || !apiKey) {
	throw new Error("Algolia App ID and API Key are required.");
}

export const search_client = searchClient(appId, apiKey);
