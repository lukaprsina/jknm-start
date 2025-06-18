import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { ThumbnailType } from "~/lib/validators";
import { ArticleContentType } from "..";
import { PublishedArticlesToAuthors } from "./author.schema";

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
    updated_at: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    content: json("content").$type<ArticleContentType>(),
    content_preview: text("content_preview").default(""),
    thumbnail_crop: json("thumbnail_crop").$type<ThumbnailType>(),
    // image: varchar("image", { length: 255 }),
  },
  (published_article) => ({
    created_at_index: index("p_created_at_idx").on(published_article.created_at),
  }),
);

export const PublishedArticleRelations = relations(PublishedArticle, ({ many }) => ({
  published_articles_to_authors: many(PublishedArticlesToAuthors),
}));
