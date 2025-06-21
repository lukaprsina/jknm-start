import { relations } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Value } from "platejs";
import { z } from "zod/v4";
import { ThumbnailType } from "~/lib/validators";
import { ArticlesToAuthors } from "./author.schema";
import { timestamps } from "./columns.helpers";

export const ArticleStatusValidator = z.enum([
  "draft",
  "published",
  "archived",
  "deleted",
]);
export const ArticleStatus = pgEnum("article_status", ArticleStatusValidator.enum);

export const Article = pgTable(
  "article",
  {
    id: serial().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    url: varchar({ length: 255 }).notNull(),
    status: ArticleStatus().default("draft").notNull(),
    content_json: json().$type<Value>().notNull(),
    content_html: text().notNull(),
    view_count: integer().notNull().default(0),
    reading_time: integer(), // in minutes
    thumbnail_crop: json().$type<ThumbnailType>(),
    old_id: integer().unique(),
    ...timestamps,
    published_at: timestamp(),
    archived_at: timestamp(),
    migrated_at: timestamp(),
  },
  (article) => [index().on(article.created_at)],
);

export const ArticleRelations = relations(Article, ({ many }) => ({
  articles_to_authors: many(ArticlesToAuthors),
}));
