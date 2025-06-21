import { pgTable, foreignKey, unique, text, timestamp, boolean, index, serial, integer, varchar, json, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const authorType = pgEnum("author_type", ['member', 'guest'])


export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const draftArticle = pgTable("draft_article", {
	id: serial().primaryKey().notNull(),
	publishedId: integer("published_id"),
	title: varchar({ length: 255 }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	content: json(),
	contentPreview: text("content_preview").default('),
	thumbnailCrop: json("thumbnail_crop"),
}, (table) => [
	index("d_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.publishedId],
			foreignColumns: [publishedArticle.id],
			name: "draft_article_published_id_published_article_id_fk"
		}),
	unique("draft_article_published_id_unique").on(table.publishedId),
]);

export const author = pgTable("author", {
	id: serial().primaryKey().notNull(),
	authorType: authorType("author_type").notNull(),
	name: varchar({ length: 255 }).notNull(),
	googleId: varchar("google_id", { length: 255 }),
	email: text(),
	image: varchar({ length: 255 }),
});

export const publishedArticle = pgTable("published_article", {
	id: serial().primaryKey().notNull(),
	oldId: integer("old_id"),
	title: varchar({ length: 255 }).notNull(),
	url: varchar({ length: 255 }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	content: json(),
	contentPreview: text("content_preview").default('),
	thumbnailCrop: json("thumbnail_crop"),
}, (table) => [
	index("p_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
]);

export const dArticlesToAuthors = pgTable("d_articles_to_authors", {
	draftId: integer("draft_id").notNull(),
	authorId: integer("author_id").notNull(),
	order: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [author.id],
			name: "d_articles_to_authors_author_id_author_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.draftId],
			foreignColumns: [draftArticle.id],
			name: "d_articles_to_authors_draft_id_draft_article_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.draftId, table.authorId], name: "d_articles_to_authors_draft_id_author_id_pk"}),
]);

export const pArticlesToAuthors = pgTable("p_articles_to_authors", {
	publishedId: integer("published_id").notNull(),
	authorId: integer("author_id").notNull(),
	order: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [author.id],
			name: "p_articles_to_authors_author_id_author_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publishedId],
			foreignColumns: [publishedArticle.id],
			name: "p_articles_to_authors_published_id_published_article_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.publishedId, table.authorId], name: "p_articles_to_authors_published_id_author_id_pk"}),
]);
