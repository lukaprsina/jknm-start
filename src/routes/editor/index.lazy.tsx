import { createLazyFileRoute } from "@tanstack/react-router";

import { Plate, usePlateEditor } from "platejs/react";
import { useEffect, useState } from "react";

import { EditorKit } from "~/components/editor-kit";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Editor, EditorContainer } from "~/components/ui/editor";
import { value } from "./-default-value";
import { Card } from "~/components/ui/card";
import { db } from "~/lib/db";
import { eq } from "drizzle-orm";
import { Article } from "~/lib/db/schema";
import { MarkdownPlugin } from "@platejs/markdown";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";

export const Route = createLazyFileRoute("/editor/")({
	component: PlateEditor,
	pendingComponent: () => <div>Loading editor... Please wait!</div>,
});

const get_markdown_validator = z.object({
	article_id: z.number().int().positive(),
});

export const get_markdown = createServerFn()
	.validator(get_markdown_validator)
	.handler(async ({ data }) => {
		const { article_id } = data;

		if (!article_id) {
			console.warn("No article ID set. Please set an article ID first.");
			return;
		}

		const article = await db.query.Article.findFirst({
			where: eq(Article.id, article_id),
		});

		if (!article?.content_markdown) {
			console.warn("No content found for the article with ID:", article_id);
			return;
		}

		return article.content_markdown;
	});

export function PlateEditor() {
	const editor = usePlateEditor({
		plugins: EditorKit,
		value,
	});

	const [articleId, setArticleId] = useState<number | undefined>();

	useEffect(() => {
		console.log("PlateEditor mounted with initial value:", value);
	}, []);

	return (
		<>
			<Card className="my-4 p-4 flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<label
						htmlFor="article-id"
						className="text-sm font-medium text-muted-foreground"
					>
						Article ID
					</label>
					<Input
						id="article-id"
						type="number"
						min={1}
						placeholder="Enter article ID..."
						value={articleId === undefined ? "" : articleId}
						onChange={(e) =>
							setArticleId(e.target.value ? Number(e.target.value) : undefined)
						}
						className="max-w-xs border-primary focus-visible:ring-2 focus-visible:ring-primary/60"
					/>
				</div>
				<div className="flex gap-2 flex-wrap">
					<Button
						onClick={async () => {
							if (typeof articleId !== "number") {
								console.warn("Please set a valid article ID first.");
								return;
							}

							const markdown = await get_markdown({
								data: { article_id: articleId },
							});

							if (!markdown) {
								console.warn(
									"No markdown content found for the article ID:",
									articleId,
								);
								return;
							}

							console.log("Loaded markdown content:", { articleId, markdown });
							const new_value = editor
								.getApi(MarkdownPlugin)
								.markdown.deserialize(markdown);
							editor.tf.setValue(new_value);
						}}
					>
						Load New Content
					</Button>
					<Button onClick={() => console.log({ children: editor.children })}>
						Log contents
					</Button>
				</div>
			</Card>
			<Plate editor={editor}>
				<EditorContainer>
					<Editor variant="demo" />
				</EditorContainer>
			</Plate>
		</>
	);
}
