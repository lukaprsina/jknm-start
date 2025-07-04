## Context
I am rewriting a Slovenian caving blog website with a built-in PlateJS editor to edit the posts (it works like shadcn/ui, you download the files into your project directly). I use BunJS as the package manager, the new Tanstack Start with ReactJS (also Tanstack Router, Tanstack Query), shadcn/ui and DrizzleORM connected to Supabase Cloud.

The previous version of the site used an editor called EditorJS. It has it's own ecosystem of plugins, but I just used the official ones. I am migrating to a completely new project. The challenge is to transform all articles/posts from the EditorJS internal representation to the PlateJS internal representation. There are about 700 posts in my database, totalling 62 megabytes.

## Task
Please help me write a conversion script from EditorJS to PlateJS into `scripts\editorjs_to_platejs\converter.ts`.

I also made `scripts\editorjs_to_platejs\editorjs_plugins.md` to show you how plugins are used in EditorJS. For PlateJS, read the cloned submodule file `vendor\plate\packages\utils\src\lib\plate-types.ts`, which contains every node type.

A small EditorJS example is in `scripts\editorjs_to_platejs\editorjs.json`, while a similar json for PlateJS is in `scripts\editorjs_to_platejs\plate.json`. Use that to figure out how inline elements are stored (bold, italic, links,...). Differences include the inline break (EditorJS uses <br>, PlateJS uses \n - of course escaping is done with \\n). EditorJS also places useless &nbsp; everywhere, you can turn them into normal spaces, no problem. Inline styling fields (withBorder, withBackground, stretched in the image plugin, and so on), fonts and so on aren't important, you can ignore them.

I also gave you access to local autogenerated PlateJS docs in `src\content\docs\plate`, feel free to query them.

The task is to make the function:

```
import { Value } from "platejs"

function convert_platejs_to_editorjs(editorjs_value: ArticleContentType): Value
```

I will make a main function and the loop. Thank you.

#codebase 