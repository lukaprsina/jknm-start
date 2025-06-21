import { db } from "~/lib/db";

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

/* 
head of articles.json

[
  {
    "id": 215,
    "old_id": 229,
    "title": "Čaganka - uradna rekordna globina",
    "url": "caganka-uradna-rekordna-globina",
    "created_at": "2011-09-13T00:00:00.000Z",
    "updated_at": "2024-12-11T18:10:49.218Z",
    "content": {
      "time": 1728160129247,
      "blocks": [
        {
          "id": "LaXkaogsLu",
          "type": "header",
          "data": {
            "text": "Čaganka - uradna rekordna globina",
            "level": 1
          }
        },
        {
          "id": "ZZqQkWW2Qt",
          "type": "paragraph",
          "data": {
            "text": "Po zadnji akciji ter po opravljenih meritvah, ki sva jih \nopravila Jože Stopar in Mihael Rukše, je nov dolenjski globinski rekord potrjen s številko <b>264,27 m</b>."
          }
        },
        ...
*/

async function main() {
  db.query.Article.findFirst();
  /*
    Example to update an article with new content
    db.update(Article).set({

    })
    */
}

await main();
