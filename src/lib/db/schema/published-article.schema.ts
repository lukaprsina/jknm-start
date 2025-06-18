import { relations } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { ThumbnailType } from "~/lib/validators";
import { PublishedArticlesToAuthors } from "./author.schema";
import { timestamps } from "./columns.helpers";
import { ArticleContentType } from "./type.helpers";

export const PublishedArticle = pgTable(
  "published_article",
  {
    id: serial().primaryKey(),
    old_id: integer(),
    title: varchar({ length: 255 }).notNull(),
    url: varchar({ length: 255 }).notNull(),
    ...timestamps,
    content: json().$type<ArticleContentType>(),
    content_preview: text().default(""),
    thumbnail_crop: json().$type<ThumbnailType>(),
    // image: varchar({ length: 255 }),
  },
  (published_article) => [index("p_created_at_idx").on(published_article.created_at)],
);

export const PublishedArticleRelations = relations(PublishedArticle, ({ many }) => ({
  published_articles_to_authors: many(PublishedArticlesToAuthors),
}));
