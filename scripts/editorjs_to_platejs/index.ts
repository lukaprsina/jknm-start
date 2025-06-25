import { parse as csvParse } from "csv-parse/sync";
import { readFileSync } from "fs";
import fs_promises from "fs/promises";
import path, { join } from "path";
import slugify from "slugify";
import { db } from "~/lib/db";
import { Article } from "~/lib/db/schema";
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

interface JKNMSIArticle {
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
  const jknmsi_articles: JKNMSIArticle[] = JSON.parse(articlesData);

  console.log(`Found ${jknmsi_articles.length} articles to migrate`);

  // Read the markdown_articles.json file
  const markdownArticlesPath = join(
    process.cwd(),
    "scripts",
    "editorjs_to_platejs",
    "markdown_articles.json",
  );
  console.log("Reading markdown articles from:", markdownArticlesPath);
  const markdownArticlesData = readFileSync(markdownArticlesPath, "utf-8");
  const markdown_articles: MarkdownArticle[] = JSON.parse(markdownArticlesData);

  // Read original articles from CSV
  const csv_articles = await read_from_csv();
  console.log(`Found ${csv_articles.length} original articles from CSV to process`);

  let successCount = 0;
  let errorCount = 0;

  const article_data: (typeof Article.$inferInsert)[] = [];

  for (let i = 0; i < jknmsi_articles.length; i++) {
    const jknmsi_article = jknmsi_articles[i];

    const markdown_article = markdown_articles.find(
      (article) => article.id === jknmsi_article.old_id,
    );

    const csv_article = csv_articles.find(
      (article) => article.objave_id === jknmsi_article.old_id,
    );

    try {
      const title = csv_article?.title ?? jknmsi_article.title;

      console.log(`Processing article ${i + 1}/${jknmsi_articles.length}: "${title}"`);

      const slug = slugify(title, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g, // Remove special characters
      });

      const new_article: typeof Article.$inferInsert = {
        title,
        slug,
        url: `www.jknm.si/novica/${slug}`,
        created_at: new Date(jknmsi_article.created_at),
        updated_at: new Date(jknmsi_article.updated_at),
        old_id: jknmsi_article.old_id,
        thumbnail_crop: jknmsi_article.thumbnail_crop,
      };

      if (markdown_article) {
        new_article.content_markdown = markdown_article.markdown;
      } else if (jknmsi_article.content) {
        new_article.content_editorjs = JSON.stringify(jknmsi_article.content);
      } else {
        throw new Error(
          `No content found for article "${jknmsi_article.title}" with old_id ${jknmsi_article.old_id}, new_id ${jknmsi_article.id}`,
        );
      }

      article_data.push(new_article);

      successCount++;

      if (i % 50 === 49) {
        console.log(`Progress: ${i + 1}/${jknmsi_articles.length} articles processed`);
      }
    } catch (error) {
      console.error(`Error processing article "${jknmsi_article.title}":`, error);
      errorCount++;

      // Maybe continue with next article instead of stopping
      break;
    }

    if (errorCount === 0)
      await db.insert(Article).values(article_data).onConflictDoNothing();
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Successfully migrated: ${successCount} articles`);
  console.log(`Errors: ${errorCount} articles`);
  console.log(`Total processed: ${jknmsi_articles.length} articles`);
}

await main();

interface ObjaveType {
  ID: string;
  Kategorija: string;
  Naslov: string;
  Tekst: string;
  Datum1: string;
  ZadnjaSprememba: string;
}

export interface ImportedArticle {
  objave_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function read_from_csv() {
  const imported_articles: ImportedArticle[] = [];

  const objave_path = path.join(
    process.cwd(),
    "scripts/editorjs_to_platejs/original-articles.csv",
  );
  const objave_string = await fs_promises.readFile(objave_path, "utf8");
  // Use csv-parse/sync for synchronous parsing
  const records = csvParse(objave_string, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ObjaveType[];

  for (const objava of records) {
    // Kategorija is a string in CSV, convert to number
    const kategorija = Number(objava.Kategorija);
    switch (kategorija) {
      case 1: {
        imported_articles.push({
          objave_id: Number(objava.ID),
          title: objava.Naslov,
          content: objava.Tekst,
          created_at: objava.Datum1,
          updated_at: objava.ZadnjaSprememba,
        });
        break;
      }
      case 2: {
        break;
      }
      default: {
        throw new Error(`Neznana kategorija ${kategorija} za objavo ID ${objava.ID}`);
      }
    }
  }

  return imported_articles;
}
