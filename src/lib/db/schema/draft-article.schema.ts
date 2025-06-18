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
import { DraftArticlesToAuthors } from "./author.schema";
import { PublishedArticle } from "./published-article.schema";

export const DraftArticle = pgTable(
  "draft_article",
  {
    id: serial("id").primaryKey(),
    published_id: integer("published_id")
      .unique()
      .references(() => PublishedArticle.id),
    title: varchar("title", { length: 255 }).notNull(),
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
  (draft_article) => ({
    created_at_index: index("d_created_at_idx").on(draft_article.created_at),
  }),
);

export const DraftArticleRelations = relations(DraftArticle, ({ one, many }) => ({
  draft_articles_to_authors: many(DraftArticlesToAuthors),
  published_article: one(PublishedArticle, {
    fields: [DraftArticle.published_id],
    references: [PublishedArticle.id],
  }),
}));
