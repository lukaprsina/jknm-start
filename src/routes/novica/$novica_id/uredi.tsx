import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { article_query_options } from ".";
import { PlateEditorFromMarkdown } from "~/components/plate-editor-from-markdown";

export const Route = createFileRoute("/novica/$novica_id/uredi")({
	component: RouteComponent,
});

const route_api = getRouteApi("/novica/$novica_id/uredi");

function RouteComponent() {
	const { novica_id } = route_api.useParams();

	const novica_id_number = Number(novica_id);

	const { data: article } = useSuspenseQuery(
		article_query_options(novica_id_number),
	);

	if (isNaN(novica_id_number)) {
		throw new Error("Invalid article ID");
	}

	if (!article.content_markdown) {
		throw new Error(`No content found for the article with ID: ${novica_id_number}`);
	}

	return (
		<PlateEditorFromMarkdown markdown={article.content_markdown} />
	);
}

/* 
<Card className="my-4 p-4 flex flex-col gap-4">
	<div className="flex gap-2 flex-wrap">
		<Button onClick={() => console.log({ children: editor.children })}>
			Log contents
		</Button>
	</div>
</Card>
*/