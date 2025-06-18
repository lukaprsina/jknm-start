import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { DraftArticle } from "./draft-article.schema";
import { PublishedArticle } from "./published-article.schema";

export const author_type_enum = pgEnum("author_type", ["member", "guest"]);

// guests have name only
export const Author = pgTable("author", {
  id: serial().primaryKey(),
  author_type: author_type_enum().notNull(),
  name: varchar({ length: 255 }).notNull(),
  google_id: varchar({ length: 255 }),
  email: text(),
  image: varchar({ length: 255 }),
});

export const PublishedArticlesToAuthors = pgTable(
  "p_articles_to_authors",
  {
    published_id: integer()
      .notNull()
      .references(() => PublishedArticle.id, {
        onDelete: "cascade",
      }),
    author_id: integer()
      .notNull()
      .references(() => Author.id, {
        onDelete: "cascade",
      }),
    order: integer().default(0).notNull(),
  },
  (published_articles_to_authors) => [
    primaryKey({
      columns: [
        published_articles_to_authors.published_id,
        published_articles_to_authors.author_id,
      ],
    }),
  ],
);

export const PublishedArticlesToAuthorsRelations = relations(
  PublishedArticlesToAuthors,
  ({ one }) => ({
    article: one(PublishedArticle, {
      fields: [PublishedArticlesToAuthors.published_id],
      references: [PublishedArticle.id],
    }),
    author: one(Author, {
      fields: [PublishedArticlesToAuthors.author_id],
      references: [Author.id],
    }),
  }),
);

export const DraftArticlesToAuthors = pgTable(
  "d_articles_to_authors",
  {
    draft_id: integer()
      .notNull()
      .references(() => DraftArticle.id, { onDelete: "cascade" }),
    author_id: integer()
      .notNull()
      .references(() => Author.id, {
        onDelete: "cascade",
      }),
    order: integer().default(0).notNull(),
  },
  (draft_articles_to_authors) => [
    primaryKey({
      columns: [draft_articles_to_authors.draft_id, draft_articles_to_authors.author_id],
    }),
  ],
);

export const DraftArticlesToAuthorsRelations = relations(
  DraftArticlesToAuthors,
  ({ one }) => ({
    article: one(DraftArticle, {
      fields: [DraftArticlesToAuthors.draft_id],
      references: [DraftArticle.id],
    }),
    author: one(Author, {
      fields: [DraftArticlesToAuthors.author_id],
      references: [Author.id],
    }),
  }),
);
