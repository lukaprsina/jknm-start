import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { article_query_options } from ".";

export const Route = createFileRoute("/novica/$novica_id/uredi")({
  component: RouteComponent,
});

const route_api = getRouteApi("/novica/$novica_id/uredi");

function RouteComponent() {
  const { novica_id } = route_api.useParams();

  const novica_id_number = Number(novica_id);

  const { data: article } = useSuspenseQuery(article_query_options(novica_id_number));

  if (isNaN(novica_id_number)) {
    throw new Error("Invalid article ID");
  }

  return (
    <div>
      <p>{article.title}</p>
    </div>
  );
}
