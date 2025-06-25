import { searchClient } from "@algolia/client-search";

const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;

if (!appId || !apiKey) {
  throw new Error("Algolia App ID and API Key are required.");
}

export const search_client = searchClient(appId, apiKey);
