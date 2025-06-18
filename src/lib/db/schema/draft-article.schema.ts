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
import { DraftArticlesToAuthors } from "./author.schema";
import { timestamps } from "./columns.helpers";
import { PublishedArticle } from "./published-article.schema";
import { ArticleContentType } from "./type.helpers";

export const DraftArticle = pgTable(
  "draft_article",
  {
    id: serial().primaryKey(),
    published_id: integer()
      .unique()
      .references(() => PublishedArticle.id),
    title: varchar({ length: 255 }).notNull(),
    ...timestamps,
    content: json().$type<ArticleContentType>(),
    content_preview: text().default(""),
    thumbnail_crop: json().$type<ThumbnailType>(),
    // image: varchar({ length: 255 }),
  },
  (draft_article) => [index("d_created_at_idx").on(draft_article.created_at)],
);

export const DraftArticleRelations = relations(DraftArticle, ({ one, many }) => ({
  draft_articles_to_authors: many(DraftArticlesToAuthors),
  published_article: one(PublishedArticle, {
    fields: [DraftArticle.published_id],
    references: [PublishedArticle.id],
  }),
}));
