import { readFileSync } from "fs";
import { join } from "path";
import { db } from "~/lib/db";
import { Article } from "~/lib/db/schema/article.schema";
import { ThumbnailType } from "~/lib/validators";
import { convert_editorjs_to_platejs, type ArticleContentType } from "./converter";

/*
Old EditorJS PublishedArticle table

export const PublishedArticle = pgTable(
"published_article",
{
    id: serial("id").primaryKey(),
    old_id: integer("old_id"),
    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
    ).notNull(),
    content: json("content").$type<ArticleContentType>(),
    content_preview: text("content_preview").default(""),
    thumbnail_crop: json("thumbnail_crop").$type<ThumbnailType>(),
    // image: varchar("image", { length: 255 }),
},
(published_article) => ({
    created_at_index: index("p_created_at_idx").on(
    published_article.created_at,
    ),
}),
);
*/

interface OldArticle {
  id: number;
  old_id: number | null;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
  content: ArticleContentType;
  content_preview: string;
  thumbnail_crop: ThumbnailType | null;
}

function generateSlug(url: string): string {
  // Clean up the URL to make it a proper slug
  return url
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function calculateReadingTime(content: ArticleContentType): number {
  // Estimate reading time based on content blocks
  let wordCount = 0;

  for (const block of content.blocks) {
    if (block.type === "paragraph" || block.type === "header") {
      const data = block.data as { text?: string };
      if (data.text) {
        // Strip HTML tags and count words
        const textContent = data.text.replace(/<[^>]*>/g, " ");
        wordCount += textContent.split(/\s+/).filter((word) => word.length > 0).length;
      }
    } else if (block.type === "list") {
      const data = block.data as { items?: string[] };
      if (data.items) {
        for (const item of data.items) {
          const textContent = item.replace(/<[^>]*>/g, " ");
          wordCount += textContent.split(/\s+/).filter((word) => word.length > 0).length;
        }
      }
    }
  }

  // Average reading speed: 200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200));
}

function calculateContentLength(content: ArticleContentType): number {
  // Calculate total character count of text content
  let charCount = 0;

  for (const block of content.blocks) {
    if (block.type === "paragraph" || block.type === "header") {
      const data = block.data as { text?: string };
      if (data.text) {
        // Strip HTML tags and count characters
        const textContent = data.text.replace(/<[^>]*>/g, "");
        charCount += textContent.length;
      }
    } else if (block.type === "list") {
      const data = block.data as { items?: string[] };
      if (data.items) {
        for (const item of data.items) {
          const textContent = item.replace(/<[^>]*>/g, "");
          charCount += textContent.length;
        }
      }
    }
  }

  return charCount;
}

function generateExcerpt(content: ArticleContentType): string | null {
  // Extract first paragraph or header as excerpt
  for (const block of content.blocks) {
    if (block.type === "paragraph" || block.type === "header") {
      const data = block.data as { text?: string };
      if (data.text) {
        // Strip HTML tags and truncate to 500 characters
        const textContent = data.text.replace(/<[^>]*>/g, " ").trim();
        if (textContent.length > 0) {
          return textContent.length > 497
            ? textContent.substring(0, 497) + "..."
            : textContent;
        }
      }
    }
  }
  return null;
}

async function main() {
  console.log("Starting EditorJS to PlateJS migration...");

  // Read the articles.json file
  const articlesPath = join(
    process.cwd(),
    "scripts",
    "editorjs_to_platejs",
    "articles.json",
  );
  console.log("Reading articles from:", articlesPath);

  const articlesData = readFileSync(articlesPath, "utf-8");
  const oldArticles: OldArticle[] = JSON.parse(articlesData);

  console.log(`Found ${oldArticles.length} articles to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < oldArticles.length; i++) {
    const oldArticle = oldArticles[i];

    try {
      console.log(
        `Processing article ${i + 1}/${oldArticles.length}: "${oldArticle.title}"`,
      );

      // Convert EditorJS content to PlateJS
      const plateContent = convert_editorjs_to_platejs(oldArticle.content);

      // Calculate derived fields
      const readingTime = calculateReadingTime(oldArticle.content);
      const contentLength = calculateContentLength(oldArticle.content);
      const excerpt = generateExcerpt(oldArticle.content);
      const slug = generateSlug(oldArticle.url);

      // Insert into new Article table
      await db.insert(Article).values({
        title: oldArticle.title,
        slug: slug,
        url: oldArticle.url,
        status: "published",
        content_json: plateContent,
        content_html: null, // Will be generated later
        content_markdown: null, // Will be generated later
        excerpt: excerpt,
        view_count: 0,
        reading_time: readingTime,
        content_length: contentLength,
        thumbnail_crop: oldArticle.thumbnail_crop,
        meta_description: excerpt
          ? excerpt.length > 160
            ? excerpt.substring(0, 157) + "..."
            : excerpt
          : null,
        featured: false,
        old_id: oldArticle.old_id,
        created_at: new Date(oldArticle.created_at),
        updated_at: new Date(oldArticle.updated_at),
        published_at: new Date(oldArticle.created_at),
        migrated_at: new Date(),
      });

      successCount++;

      if (i % 50 === 0) {
        console.log(`Progress: ${i + 1}/${oldArticles.length} articles processed`);
      }
    } catch (error) {
      console.error(`Error processing article "${oldArticle.title}":`, error);
      errorCount++;

      // Continue with next article instead of stopping
      continue;
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Successfully migrated: ${successCount} articles`);
  console.log(`Errors: ${errorCount} articles`);
  console.log(`Total processed: ${oldArticles.length} articles`);
}

await main();
