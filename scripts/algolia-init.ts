import { asc, eq } from "drizzle-orm";
import { Article } from "./../src/lib/db/schema/article.schema";

/**
 * Enhanced Algolia Indexing Script for PlateJS-based Caving Blog
 * =============================================================
 *
 * This script demonstrates how to:
 * 1. Convert PlateJS content (JSON) to Markdown for Algolia indexing
 * 2. Split long documents by H2 headings to stay within Algolia limits
 * 3. Create properly structured Algolia objects with metadata for search and filtering
 * 4. Support both development (markdown files) and production (database) workflows
 *
 * Key Architecture Decisions:
 * - Database is the source of truth (stores PlateJS JSON)
 * - Algolia is the search index (stores searchable Markdown)
 * - Documents are split by H2 headings to stay under size limits
 * - Each section gets a unique objectID: "{articleId}-{sectionIndex}"
 * - Use attributeForDistinct on parent_post_id for clean search results
 *
 * Algolia Limits (Free Build Plan):
 * - Max 1M records total (including sorting replicas)
 * - Max 100KB per record, 10KB average
 * - With 4 sortable columns: (2*4 + 1) * posts = 9 * posts records
 * - Theoretical limit: ~111K posts, practical limit: much lower due to splitting
 */

import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { algoliasearch } from "algoliasearch";
import { Resource } from "sst";
import { z } from "zod/v4";
import { db } from "~/lib/db";
import { ArticlesToAuthors } from "~/lib/db/schema";
import { ArticleStatusValidator } from "~/lib/db/schema/article.schema";

// Add PlateJS Markdown utilities for real conversion
// import { createSlateEditor } from "platejs";
// import { MarkdownPlugin } from "@platejs/markdown";
// import type { Value } from "platejs";

const client = algoliasearch(
  Resource.AlgoliaAppId.value,
  Resource.AlgoliaAdminApiKey.value,
);

// Configuration
const ALGOLIA_CONFIG = {
  baseUrl: "https://www.jknm.si",
  indexName: "articles", // Stay well under 10KB average
  maxContentLength: 8000,
} as const;

// Zod validator for Algolia objects
const AlgoliaObjectSchema = z.object({
  archived_at: z.date().nullable(), // Format: "articleId-sectionIndex" for sections
  authors: z.array(z.string()).optional(),
  content: z.string(), // authors are indexed, can be used for filtering
  created_at: z.date(),
  deleted_at: z.date().nullable(),
  // searchable
  objectID: z.string(),
  // unsearchable, just for filtering
  old_id: z.number().nullable(),
  parent_post_id: z.number(), // Order of section within article
  parent_post_slug: z.string(), // Article database ID
  permalink: z.url(), // For URL construction
  published_at: z.date().nullable(),
  section: z.string(),
  // metadata for section splitting
  section_order: z.number(),
  status: ArticleStatusValidator,
  title: z.string(),
  updated_at: z.date(),
});

type AlgoliaObject = z.infer<typeof AlgoliaObjectSchema>;

interface DocumentSection {
  section: string;
  content: string;
}

// Enhanced splitting with better metadata - for real database articles
const createAlgoliaObjectsFromArticle = (
  sections: DocumentSection[],
  originalPost: typeof Article.$inferSelect,
): AlgoliaObject[] => {
  return sections.map((section, index) => {
    const algoliaObject: AlgoliaObject = {
      archived_at: originalPost.archived_at, // Unique per section
      authors: [],
      content: section.content, // TODO: Join with authors table
      created_at: originalPost.created_at,
      deleted_at: originalPost.deleted_at,
      objectID: `${originalPost.id}-${index}`,
      // Metadata from database
      old_id: originalPost.old_id,
      parent_post_id: originalPost.id,
      parent_post_slug: originalPost.slug || originalPost.url,
      permalink: new URL(originalPost.url, ALGOLIA_CONFIG.baseUrl).href, // Use slug if available
      published_at: originalPost.published_at,
      section: section.section,
      // Add section metadata
      section_order: index,
      status: originalPost.status,
      title: originalPost.title,
      updated_at: originalPost.updated_at,
    };

    // Validate the object
    return AlgoliaObjectSchema.parse(algoliaObject);
  });
};

// Process articles from database - complete workflow
const processArticlesFromDatabase = async () => {
  try {
    // Example: This would come from your database query
    const articles = await db.query.Article.findMany({
      where: eq(Article.status, "published"),
      with: {
        articles_to_authors: {
          orderBy: asc(ArticlesToAuthors.order),
          with: {
            author: true,
          },
        },
      },
    });

    const algoliaObjects: AlgoliaObject[] = [];

    /* for (const article of articles) {
      // Step 2: Split the markdown into sections by H2 headings
      // For this demo, we'll create a temporary markdown file
      const tempMarkdownPath = join(process.cwd(), "temp-article.md");
      writeFile(tempMarkdownPath, markdownContent);

      // Step 3: Parse and split the markdown
      const sections = await parseAndSplitMarkdown(tempMarkdownPath);
      console.log(
        `Found ${sections.length} sections in article: ${article.title}`,
      );

      // Step 4: Create Algolia objects with proper metadata
      algoliaObjects.push(
        ...createAlgoliaObjectsFromArticle(sections, article),
      );
      console.log(`Created ${algoliaObjects.length} Algolia objects`);

      // Step 5: Log the objects for debugging
      algoliaObjects.forEach((obj, index) => {
        console.log(`Section ${index + 1}:`, {
          content: obj.content.substring(0, 100) + "...",
          objectID: obj.objectID,
          parent_post_id: obj.parent_post_id,
          section: obj.section,
          section_order: obj.section_order,
          title: obj.title,
        });
      });
      // Clean up temp file
      await unlink(tempMarkdownPath)
    } */

    // Step 6: Index in Algolia
    const result = await client.saveObjects({
      indexName: ALGOLIA_CONFIG.indexName,
      objects: algoliaObjects,
    });

    return result;
  } catch (error) {
    console.error("Error processing articles from database:", error);
    throw error;
  }
};

processArticlesFromDatabase()
  .then((result) => {
    console.log("Successfully indexed database articles!");
    console.log("Result:", result);
  })
  .catch((err) => console.error(err));
