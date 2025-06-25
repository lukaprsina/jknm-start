import { readFileSync } from "fs";
import { join } from "path";
import { ThumbnailType } from "~/lib/validators";
/* import { db } from "~/lib/db";
import { Article } from "~/lib/db/schema/article.schema"; */

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

// EditorJS editor value is ArticleContentType:
export interface ArticleContentType {
  time?: number;
  blocks: ArticleBlockType[];
  version?: string;
}

export interface ArticleBlockType {
  id?: string;
  type: string;
  data: object;
}

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

type MarkdownArticle = {
  id: number;
  markdown: string;
};

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

  // Read the markdown_articles.json file
  const markdownArticlesPath = join(
    process.cwd(),
    "scripts",
    "editorjs_to_platejs",
    "markdown_articles.json",
  );
  console.log("Reading markdown articles from:", markdownArticlesPath);
  const markdownArticlesData = readFileSync(markdownArticlesPath, "utf-8");
  const markdownArticles: MarkdownArticle[] = JSON.parse(markdownArticlesData);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < oldArticles.length; i++) {
    const oldArticle = oldArticles[i];
    const markdownArticle = markdownArticles.find(
      (article) => article.id === oldArticle.old_id,
    );

    if (!markdownArticle) {
      throw new Error(`No markdown article found for old ID ${oldArticle.old_id}`);
    }

    try {
      console.log(
        `Processing article ${i + 1}/${oldArticles.length}: "${oldArticle.title}"`,
      );

      // TODO: Convert EditorJS content to PlateJS

      /*
      Ignore oldArticle.url, recreate it from the title with slugify
      slugify(oldArticle.title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g, // Remove special characters
      });
      */

      successCount++;

      if (i % 50 === 0) {
        console.log(`Progress: ${i + 1}/${oldArticles.length} articles processed`);
      }
    } catch (error) {
      console.error(`Error processing article "${oldArticle.title}":`, error);
      errorCount++;

      // Maybe continue with next article instead of stopping
      break;
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Successfully migrated: ${successCount} articles`);
  console.log(`Errors: ${errorCount} articles`);
  console.log(`Total processed: ${oldArticles.length} articles`);
}

await main();
