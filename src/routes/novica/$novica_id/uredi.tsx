import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { article_query_options } from "./route";

export const Route = createFileRoute("/novica/$novica_id/uredi")({
  component: RouteComponent,
});

const route_api = getRouteApi("/novica/$novica_id/uredi")

function RouteComponent() {
  const { novica_id } = route_api.useParams();

  const novica_id_number = Number(novica_id);

  if (isNaN(novica_id_number)) {
    throw new Error("Invalid article ID");
  }

  useSuspenseQuery(article_query_options(novica_id_number));

  return <div><p>    </p>
    <p>Hello "/novica/$novica_id/uredi"!</p></div>;
}
