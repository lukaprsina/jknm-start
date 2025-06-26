import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { article_query_options } from ".";
import { Plate, usePlateEditor } from "platejs/react";
import { EditorKit } from "~/components/editor-kit";
import { useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { MarkdownPlugin } from "@platejs/markdown";
import { Editor, EditorContainer } from "~/components/ui/editor";

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
		console.warn(
			"No content found for the article with ID:",
			novica_id_number,
		);
		return <div>No content found</div>;
	}

	return (
		<PlateEditor initialValue={article.content_markdown} />
	);
}

function PlateEditor({ initialValue }: { initialValue: string }) {
	const editor = usePlateEditor({
		plugins: EditorKit,
		value: (editor) => {
			if (!initialValue) {
				console.warn(
					"No content found for the article"
				);
				return [
					{ type: "paragraph", children: [{ text: "No content found" }] },
				];
			}

			return editor
				.getApi(MarkdownPlugin)
				.markdown.deserialize(initialValue);
		},
	});


	useEffect(() => {
		console.log("PlateEditor mounted with initial value:", { initialValue });
	}, [initialValue]);

	return (
		<>
			<Card className="my-4 p-4 flex flex-col gap-4">
				<div className="flex gap-2 flex-wrap">
					<Button onClick={() => console.log({ children: editor.children })}>
						Log contents
					</Button>
				</div>
			</Card>
			<Plate editor={editor}>
				<EditorContainer>
					<Editor variant="demo" spellCheck={false} />
				</EditorContainer>
			</Plate>
		</>
	);
}