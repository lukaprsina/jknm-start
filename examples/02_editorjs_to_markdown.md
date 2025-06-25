## Context

I am rewriting a Slovenian caving blog website with a built-in PlateJS editor to edit the posts. I use BunJS as the package manager, the new Tanstack Start with React (also Tanstack Router, integrated with Tanstack Query), shadcn/ui, lucide-icons, Algolia (javascript client v5, react-instantsearch and autocomplete) and DrizzleORM connected to Supabase Cloud.

The previous version of the site used NextJS and an editor called EditorJS. It has it's own ecosystem of plugins, but I just used the official ones. But like I said, I am migrating to a completely new project with Tanstack Start and PlateJS. The challenge is to transform all articles/posts from the EditorJS internal representation to the PlateJS internal representation. There are about 700 posts in my database, totalling 62 megabytes. Instead of converting EditorJS JSON to PlateJS JSON directly, I want to use Markdown (or rather simple MDX) as an intermediary between the two editors. And I also only used `[ "header", "paragraph", "image", "list", "embed" ]` plugins with EditorJS, in all my posts, I checked. That makes this much easier.

## Task

I forked EditorJS to markdown parser: `https://github.com/carrara88/editorjs-md-parser`, because it lacked the embed block plugin (it allows you to add files, like PDF's, as download buttons). I simplified it a bunch, the repo is at `vendor/editorjs-md-parser`, I want you to go through every file in `vendor/editorjs-md-parser/src/MarkdownParser.js`, and correct the markdown parsing implementation for every plugin to be compatible with PlateJS (embed is definitely wrong).

As for how will you actually know how to convert from EditorJS JSON values to markdown (suitable for PlateJS), I provided the snippet at `scripts/editorjs_to_platejs/plate_markdown.mdx`, which is pulled straight from PlateJS docs. That is valid Markdown for PlateJS, which can then be converted to PlateJS markdown via `@platejs/markdown` without loss (two-way lossles conversion). I think you can infer how PlateJS extends the markdown format from the snippet. In `scripts/editorjs_to_platejs/editorjs_plugins.md` you can learn about the EditorJS JSON internal representation of the plugins I used.

P.S.: Be careful when parsing line breaks. One newline means a soft break, two means a new element. They are not the same. However, in `parseToMarkdown`, they do `return parsedData.join("\n");`, which adds another newline, so for example, in `parseHeaderToMarkdown`, one `\n` becomes `\n\n`.

Read `scripts\editorjs_to_platejs\plate_markdown.mdx` carefully. For example, when doing embeds, don't make an iframe, PlateJS doesn't use markdown, it uses MDX. In the example, file embeds are `<file name="sample.pdf" src="https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf" width="80%" isUpload="true" />`, videos are <video ... />. My articles contain both files and videos (no audio), and they are both EditorJS embeds. I want you to separate them. If the domain is youtube or vimeo, add them as <video />.

P.P.S.: This is the first part of the plan. I will then use the modified `editorjs-md-parser` to convert every EditorJS article from the old site into markdown, save it to disk, then read that file in the new project, convert it to PlateJS internal representation, and finally save it to the database.

#codebase
