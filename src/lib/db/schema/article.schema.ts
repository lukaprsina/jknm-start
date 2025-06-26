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
export const ArticleStatus = pgEnum(
	"article_status",
	ArticleStatusValidator.enum,
);

export const Article = pgTable(
	"article",
	{
		id: serial().primaryKey(),
		title: varchar({ length: 255 }).notNull(),
		slug: varchar({ length: 255 }).unique().notNull(), // URL-friendly version
		url: varchar({ length: 255 }).notNull(), // Full URL for legacy
		status: ArticleStatus().default("draft").notNull(),
		content_json: json().$type<Value>(),
		content_html: text(),
		content_markdown: text(), // For Algolia indexing
		content_editorjs: text(), // For EditorJS compatibility
		excerpt: varchar({ length: 500 }), // For previews/SEO
		view_count: integer().default(0),
		reading_time: integer().default(0), // in minutes
		content_length: integer().default(0), // Character count for analytics
		thumbnail_crop: json().$type<ThumbnailType>(),
		meta_description: varchar({ length: 160 }), // SEO
		old_id: integer().unique(),
		...timestamps,
		published_at: timestamp(),
		archived_at: timestamp(),
	},
	(article) => [
		index().on(article.created_at),
		index().on(article.slug),
		index().on(article.status),
	],
);

export const ArticleRelations = relations(Article, ({ many }) => ({
	articles_to_authors: many(ArticlesToAuthors),
}));
