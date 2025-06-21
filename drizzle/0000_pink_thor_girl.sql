-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."author_type" AS ENUM('member', 'guest');--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "draft_article" (
	"id" serial PRIMARY KEY NOT NULL,
	"published_id" integer,
	"title" varchar(255) NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"content" json,
	"content_preview" text DEFAULT '',
	"thumbnail_crop" json,
	CONSTRAINT "draft_article_published_id_unique" UNIQUE("published_id")
);
--> statement-breakpoint
CREATE TABLE "author" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_type" "author_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"google_id" varchar(255),
	"email" text,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "published_article" (
	"id" serial PRIMARY KEY NOT NULL,
	"old_id" integer,
	"title" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"content" json,
	"content_preview" text DEFAULT '',
	"thumbnail_crop" json
);
--> statement-breakpoint
CREATE TABLE "d_articles_to_authors" (
	"draft_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "d_articles_to_authors_draft_id_author_id_pk" PRIMARY KEY("draft_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "p_articles_to_authors" (
	"published_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "p_articles_to_authors_published_id_author_id_pk" PRIMARY KEY("published_id","author_id")
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_article" ADD CONSTRAINT "draft_article_published_id_published_article_id_fk" FOREIGN KEY ("published_id") REFERENCES "public"."published_article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "d_articles_to_authors" ADD CONSTRAINT "d_articles_to_authors_author_id_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."author"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "d_articles_to_authors" ADD CONSTRAINT "d_articles_to_authors_draft_id_draft_article_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."draft_article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p_articles_to_authors" ADD CONSTRAINT "p_articles_to_authors_author_id_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."author"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p_articles_to_authors" ADD CONSTRAINT "p_articles_to_authors_published_id_published_article_id_fk" FOREIGN KEY ("published_id") REFERENCES "public"."published_article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "d_created_at_idx" ON "draft_article" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "p_created_at_idx" ON "published_article" USING btree ("created_at" timestamp_ops);
*/