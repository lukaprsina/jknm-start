import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { PlateEditorFromMarkdown } from "~/components/plate-editor-from-markdown";
import { article_query_options } from ".";
import { OldSiteIframe } from "~/components/old-site-iframe";

export const Route = createFileRoute("/novica/$novica_id/primerjaj")({
  component: RouteComponent,
});

const route_api = getRouteApi("/novica/$novica_id/primerjaj");

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

  if (!article.old_id) {
    return null;
  }

  return <div><PlateEditorFromMarkdown markdown={article.content_markdown} /><OldSiteIframe old_id={article.old_id} /></div>;
}
