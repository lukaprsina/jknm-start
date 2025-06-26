import { MarkdownPlugin } from "@platejs/markdown";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { createSlateEditor, PlateStatic } from "platejs";
import { z } from "zod/v4";
import { BaseEditorKit } from "~/components/editor-base-kit";
import { db } from "~/lib/db";
import { Article } from "~/lib/db/schema";

const get_article_by_id_validator = z.object({
	id: z.number().int().positive(),
});

const get_article_by_id = createServerFn()
	.validator(get_article_by_id_validator)
	.handler(async ({ data }) => {
		type ArticleWithoutContentJSON = Omit<
			typeof Article.$inferSelect,
			"content_json"
		>;
		type ArticleWithContentJSON = ArticleWithoutContentJSON & {
			content_json: object;
		};

		const article = (await db.query.Article.findFirst({
			where: eq(Article.id, data.id),
		})) as ArticleWithContentJSON | undefined;

		return article;
	});

export function article_query_options(id: number) {
	return queryOptions({
		queryKey: ["articles", { id }],
		queryFn: async () => {
			const article = await get_article_by_id({ data: { id } });

			if (!article) throw new Error("Article not found");

			return article;
		},
	});
}

export const Route = createFileRoute("/novica/$novica_id/")({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		const param_id = Number(params["novica_id"]);

		if (isNaN(param_id)) throw new Error("Invalid article ID");

		await context.queryClient.ensureQueryData(article_query_options(param_id));
	},
});

const route_api = getRouteApi("/novica/$novica_id/");

function RouteComponent() {
	const { novica_id } = route_api.useParams();

	const novica_id_number = Number(novica_id);

	const { data: article } = useSuspenseQuery(
		article_query_options(novica_id_number),
	);

	const editor = createSlateEditor({
		plugins: BaseEditorKit,
		nodeId: false, // Disable NodeIdPlugin to prevent hydration mismatches
		value: (editor) => {
			if (isNaN(novica_id_number)) {
				throw new Error("Invalid article ID");
			}

			if (!article.content_markdown) {
				console.warn(
					"No content found for the article with ID:",
					novica_id_number,
				);
				return [
					{ type: "paragraph", children: [{ text: "No content found" }] },
				];
			}

			return editor
				.getApi(MarkdownPlugin)
				.markdown.deserialize(article.content_markdown);
		},
	});

	return <PlateStatic editor={editor} />;
}
