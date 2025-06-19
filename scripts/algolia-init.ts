import { algoliasearch } from "algoliasearch";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import { toString } from "mdast-util-to-string";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Root, Heading, RootContent } from "mdast";

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!,
);

const object_template = {
  // searchable
  title: "Algolia Search",
  permalink: "https://www.jknm.si/novica/algolia-search",
  content: "",
  section: "",
  status: "published", // draft, published, archived, deleted
  // unsearchable, just for filtering
  db_id: 1,
  old_db_id: null,
  created_at: new Date(),
  last_updated_at: new Date(),
  last_published_at: new Date(),
  last_deleted_at: null,
};

// Fetch and index objects in Algolia
const processRecords = async () => {
  return await client.saveObjects({
    indexName: "articles",
    objects: [],
  });
};

processRecords()
  .then(() => console.log("Successfully indexed objects!"))
  .catch((err) => console.error(err));
