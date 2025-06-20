export function PostContent({
  slug,
  isStaticPage = false,
}: {
  slug: string;
  isStaticPage?: boolean;
}) {
  //   const { data: post, isLoading } = usePost(slug, isStaticPage);
  const isLoading = false; // Simulating loading state
  const post = {
    title: "Sample Post Title",
    content: "<p>This is the content of the post.</p>",
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  if (!post) {
    return <div className="flex h-full items-center justify-center">Post not found</div>;
  }

  return (
    <article className="prose prose-invert max-w-none">
      <h1>{post.title}</h1>
      <pre>{slug}</pre>
      <pre>{isStaticPage ? "Static" : "Dynamic"}</pre>
      {/* eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml */}
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
