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

import { algoliasearch } from "algoliasearch";
import { join } from "path";
import { z } from "zod/v4";
import { db } from "~/lib/db";
import { ArticlesToAuthors } from "~/lib/db/schema";
import { ArticleStatusValidator } from "~/lib/db/schema/article.schema";

// Add PlateJS Markdown utilities for real conversion
// import { createSlateEditor } from "platejs";
// import { MarkdownPlugin } from "@platejs/markdown";
// import type { Value } from "platejs";

const client = algoliasearch(
  process.env.VITE_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!,
);

// Configuration
const ALGOLIA_CONFIG = {
  indexName: "articles",
  maxContentLength: 8000, // Stay well under 10KB average
  baseUrl: "https://www.jknm.si",
} as const;

// Zod validator for Algolia objects
const AlgoliaObjectSchema = z.object({
  // searchable
  objectID: z.string(), // Format: "articleId-sectionIndex" for sections
  title: z.string(),
  authors: z.array(z.string()).optional(), // authors are indexed, can be used for filtering
  permalink: z.url(),
  content: z.string(),
  section: z.string(),
  status: ArticleStatusValidator,
  // metadata for section splitting
  section_order: z.number(), // Order of section within article
  parent_post_id: z.number(), // Article database ID
  parent_post_slug: z.string(), // For URL construction
  // unsearchable, just for filtering
  old_id: z.number().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
  published_at: z.date().nullable(),
  archived_at: z.date().nullable(),
});

type AlgoliaObject = z.infer<typeof AlgoliaObjectSchema>;

const object_template: Omit<AlgoliaObject, "content" | "section" | "section_order"> = {
  // searchable
  objectID: "1",
  title: "Plate Editor Documentation",
  authors: ["Jane Doe", "John Smith"],
  permalink: `${ALGOLIA_CONFIG.baseUrl}/docs/plate-editor`,
  status: "published",
  // metadata for section splitting
  parent_post_id: 1,
  parent_post_slug: "plate-editor-documentation",
  // unsearchable, just for filtering
  old_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  published_at: new Date(),
  archived_at: null,
  deleted_at: null,
};

interface DocumentSection {
  section: string;
  content: string;
}

// Enhanced splitting with better metadata
const createAlgoliaObjects = (sections: DocumentSection[]): AlgoliaObject[] => {
  return sections.map((section, index) => {
    const algoliaObject: AlgoliaObject = {
      ...object_template,
      objectID: `${object_template.parent_post_id}-${index}`, // Unique per section
      section: section.section,
      content: section.content,
      // Add section metadata
      section_order: index,
      // parent_post_id and parent_post_slug already in template
    };

    // Validate the object
    return AlgoliaObjectSchema.parse(algoliaObject);
  });
};

// Enhanced splitting with better metadata - for real database articles
const createAlgoliaObjectsFromArticle = (
  sections: DocumentSection[],
  originalPost: typeof Article.$inferSelect,
): AlgoliaObject[] => {
  return sections.map((section, index) => {
    const algoliaObject: AlgoliaObject = {
      objectID: `${originalPost.id}-${index}`, // Unique per section
      title: originalPost.title,
      authors: [], // TODO: Join with authors table
      permalink: new URL(originalPost.url, ALGOLIA_CONFIG.baseUrl).href,
      section: section.section,
      content: section.content,
      status: originalPost.status,
      // Add section metadata
      section_order: index,
      parent_post_id: originalPost.id,
      parent_post_slug: originalPost.slug || originalPost.url, // Use slug if available
      // Metadata from database
      old_id: originalPost.old_id,
      created_at: originalPost.created_at,
      updated_at: originalPost.updated_at,
      deleted_at: originalPost.deleted_at,
      published_at: originalPost.published_at,
      archived_at: originalPost.archived_at,
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
          with: {
            author: true,
          },
          orderBy: asc(ArticlesToAuthors.order),
        },
      },
    });

    const algoliaObjects: AlgoliaObject[] = [];

    for (const article of articles) {
      // Step 2: Split the markdown into sections by H2 headings
      // For this demo, we'll create a temporary markdown file
      const tempMarkdownPath = join(process.cwd(), "temp-article.md");
      await import("fs/promises").then((fs) =>
        fs.writeFile(tempMarkdownPath, markdownContent),
      );

      // Step 3: Parse and split the markdown
      const sections = await parseAndSplitMarkdown(tempMarkdownPath);
      console.log(`Found ${sections.length} sections in article: ${article.title}`);

      // Step 4: Create Algolia objects with proper metadata
      algoliaObjects.push(...createAlgoliaObjectsFromArticle(sections, article));
      console.log(`Created ${algoliaObjects.length} Algolia objects`);

      // Step 5: Log the objects for debugging
      algoliaObjects.forEach((obj, index) => {
        console.log(`Section ${index + 1}:`, {
          objectID: obj.objectID,
          title: obj.title,
          section: obj.section,
          content: obj.content.substring(0, 100) + "...",
          section_order: obj.section_order,
          parent_post_id: obj.parent_post_id,
        });
      });
      // Clean up temp file
      await import("fs/promises").then((fs) =>
        fs.unlink(tempMarkdownPath).catch(() => {}),
      );
    }

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

// Choose which processing method to use
const USE_DATABASE_ARTICLES = true; // Set to true to process from database

if (USE_DATABASE_ARTICLES) {
  processArticlesFromDatabase()
    .then((result) => {
      console.log("Successfully indexed database articles!");
      console.log("Result:", result);
    })
    .catch((err) => console.error(err));
} else {
  processRecords()
    .then((result) => {
      console.log("Successfully indexed markdown file!");
      console.log("Result:", result);
    })
    .catch((err) => console.error(err));
}
