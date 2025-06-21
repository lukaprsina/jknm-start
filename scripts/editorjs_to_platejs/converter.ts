import { Descendant, TElement, TText, Value } from "platejs";

/*
PlateJS

type Value = TElement[];

type UnknownObject = {
    [x: string]: unknown;
}

type TElement = {
    children: Descendant[];
    type: string;
} & UnknownObject

type TText = {
    text: string;
} & UnknownObject

type Descendant = TElement | TText
*/

// EditorJS editor value is ArticleContentType:
export interface ArticleContentType {
  time?: number;
  blocks: ArticleBlockType[];
  version?: string;
}

export interface ArticleBlockType {
  id?: string;
  type: string;
  data: object;
}

interface EditorJsListItem {
  content: string;
  items: EditorJsListItems;
}

type EditorJsListItems = (string | EditorJsListItem)[];

function mapTagToFormat(tag: string): string {
  switch (tag.toLowerCase()) {
    case "b":
    case "strong":
      return "bold";
    case "i":
    case "em":
      return "italic";
    case "u":
      return "underline";
    case "sup":
      return "superscript";
    case "sub":
      return "subscript";
    default:
      return "";
  }
}

function parseMarks(html: string): TText[] {
  const text = html.replace(/&nbsp;/g, " ").replace(/<br\s*\/?>/g, "\n");
  const fragments = text.match(/<[^>]+>|[^<]+/g) || [];
  const results: TText[] = [];
  const activeMarks: string[] = [];

  for (const fragment of fragments) {
    if (fragment.startsWith("</")) {
      activeMarks.pop();
    } else if (fragment.startsWith("<")) {
      const tagName = fragment.match(/<(\w+)/)?.[1];
      if (tagName) {
        const mark = mapTagToFormat(tagName);
        if (mark) {
          activeMarks.push(mark);
        }
      }
    } else if (fragment) {
      const textNode: TText = { text: fragment };
      activeMarks.forEach((mark) => {
        (textNode as Record<string, unknown>)[mark] = true;
      });
      results.push(textNode);
    }
  }
  return results;
}

function parseText(html: string): Descendant[] {
  if (!html) return [{ text: "" }];

  const results: Descendant[] = [];
  const parts = html.split(/(<a\s+href="[^"]+"[^>]*>.*?<\/a>)/g).filter(Boolean);

  for (const part of parts) {
    if (part.startsWith("<a")) {
      const match = part.match(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/);
      if (match) {
        const [, href, content] = match;
        const linkNode: TElement = {
          type: "a",
          url: href,
          children: parseMarks(content),
        };
        results.push(linkNode);
      }
    } else {
      results.push(...parseMarks(part));
    }
  }

  if (results.length === 0) {
    return [{ text: "" }];
  }

  const merged: Descendant[] = [];
  if (results.length > 0) {
    merged.push(results[0]);
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      const previous = merged[merged.length - 1];

      const isPreviousText = "text" in previous && !previous.type;
      const isCurrentText = "text" in current && !current.type;

      if (isPreviousText && isCurrentText) {
        const prevNode = previous as TText;
        const currNode = current as TText;
        const prevMarks = Object.keys(prevNode).filter((k) => k !== "text");
        const currMarks = Object.keys(currNode).filter((k) => k !== "text");

        if (
          prevMarks.length === currMarks.length &&
          prevMarks.every(
            (k) =>
              (prevNode as Record<string, unknown>)[k] ===
              (currNode as Record<string, unknown>)[k],
          )
        ) {
          prevNode.text += currNode.text;
        } else {
          merged.push(currNode);
        }
      } else {
        merged.push(current);
      }
    }
  }

  return merged;
}

function convertListBlock(block: ArticleBlockType): TElement[] {
  const data = block.data as {
    style: "ordered" | "unordered";
    items: EditorJsListItems;
    meta?: { start?: number };
  };
  const elements: TElement[] = [];

  const processItems = (items: EditorJsListItems, indent: number, start: number) => {
    const isOrdered = data.style === "ordered";
    const listStyleType = isOrdered ? "decimal" : "disc";

    items.forEach((item, index) => {
      const content = typeof item === "string" ? item : item.content;
      const nestedItems = typeof item === "object" && item.items ? item.items : [];

      const element: TElement = {
        type: "p",
        children: parseText(content),
        indent,
        listStyleType,
      };

      const itemNumber = start + index;
      if (isOrdered) {
        if (index === 0 && start !== 1) {
          (element as Record<string, unknown>).listRestart = itemNumber;
        } else if (index > 0 || start > 1) {
          (element as Record<string, unknown>).listStart = itemNumber;
        }
      } else if (index > 0) {
        (element as Record<string, unknown>).listStart = index + 1;
      }

      elements.push(element);

      if (nestedItems.length > 0) {
        processItems(nestedItems, indent + 1, 1);
      }
    });
  };

  processItems(data.items, 1, data.meta?.start ?? 1);
  return elements;
}

export function convert_editorjs_to_platejs(editorjs_value: ArticleContentType): Value {
  const plateValue: TElement[] = [];

  for (const block of editorjs_value.blocks) {
    switch (block.type) {
      case "header": {
        const data = block.data as { text: string; level: number };
        plateValue.push({
          type: `h${data.level}`,
          children: parseText(data.text),
        });
        break;
      }
      case "paragraph": {
        const data = block.data as { text: string };
        plateValue.push({
          type: "p",
          children: parseText(data.text),
        });
        break;
      }
      case "image": {
        const data = block.data as { file: { url: string }; caption: string };
        const imageElement: TElement = {
          type: "img",
          url: data.file.url,
          children: [{ text: "" }],
        };
        if (data.caption) {
          (imageElement as Record<string, unknown>).caption = parseText(data.caption);
        }
        plateValue.push(imageElement);
        break;
      }
      case "list": {
        plateValue.push(...convertListBlock(block));
        break;
      }
      case "embed": {
        const data = block.data as { embed: string; caption: string };
        const embedElement: TElement = {
          type: "media_embed",
          url: data.embed,
          children: [{ text: "" }],
        };
        if (data.caption) {
          (embedElement as Record<string, unknown>).caption = parseText(data.caption);
        }
        plateValue.push(embedElement);
        break;
      }
      default:
      // For now, we ignore unsupported block types.
      // console.warn(`Unsupported block type: ${block.type}`);
    }
  }

  return plateValue;
}
