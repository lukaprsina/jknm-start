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

function generateId(): string {
  return Math.random().toString(36).substr(2, 10);
}

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

function parseText(html: string): Descendant[] {
  if (!html) return [{ text: "" }];

  // Clean up HTML entities and breaks
  const cleanText = html.replace(/&nbsp;/g, " ").replace(/<br\s*\/?>/g, "\n");

  // Simple approach: parse links first, then handle inline formatting
  const results: Descendant[] = [];
  const linkRegex = /<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(cleanText)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      const beforeText = cleanText.slice(lastIndex, match.index);
      results.push(...parseInlineFormats(beforeText));
    }

    // Add link element
    const linkElement: TElement = {
      type: "a",
      url: match[1],
      id: generateId(),
      children: parseInlineFormats(match[2]),
    };
    results.push(linkElement);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < cleanText.length) {
    const remainingText = cleanText.slice(lastIndex);
    results.push(...parseInlineFormats(remainingText));
  }

  // If no links were found, just parse the whole text
  if (results.length === 0) {
    return parseInlineFormats(cleanText);
  }

  return results.length > 0 ? results : [{ text: "" }];
}

function parseInlineFormats(text: string): TText[] {
  if (!text) return [{ text: "" }];

  // Simple regex-based approach for common formatting
  const formatRegex = /<(b|strong|i|em|u|sup|sub)>(.*?)<\/\1>/g;
  const results: TText[] = [];
  let lastIndex = 0;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add unformatted text before this match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        results.push({ text: beforeText });
      }
    }

    // Add formatted text
    const format = mapTagToFormat(match[1]);
    if (format) {
      const formattedText: TText = { text: match[2] };
      formattedText[format] = true;
      results.push(formattedText);
    } else {
      results.push({ text: match[2] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining unformatted text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      results.push({ text: remainingText });
    }
  }

  // If no formatting was found, return the whole text
  if (results.length === 0) {
    return [{ text: text }];
  }

  return results;
}

function convertListBlock(block: ArticleBlockType): TElement[] {
  const data = block.data as {
    style: "ordered" | "unordered";
    items: string[]; // Simplified - EditorJS doesn't support nested lists by default
    meta?: { start?: number };
  };

  const elements: TElement[] = [];
  const isOrdered = data.style === "ordered";
  const listStyleType = isOrdered ? "decimal" : "disc";
  const startNumber = data.meta?.start ?? 1;

  data.items.forEach((item, index) => {
    const element: TElement = {
      type: "p",
      id: generateId(),
      children: parseText(item),
      indent: 1,
      listStyleType,
    };

    // Handle listStart - both ordered and unordered lists use it for proper numbering
    // First item (index 0) doesn't get listStart unless the list starts from a different number
    if (index === 0 && startNumber !== 1) {
      // Use listRestartPolite only when explicitly starting from a different number
      element.listRestartPolite = startNumber;
      element.listStart = startNumber;
    } else if (index > 0) {
      // Subsequent items get listStart to indicate their position
      element.listStart = startNumber + index;
    }
    // Note: First item with default start (1) gets no listStart property (omitted when it would be 1)

    elements.push(element);
  });

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
          id: generateId(),
          children: parseText(data.text),
        });
        break;
      }
      case "paragraph": {
        const data = block.data as { text: string };
        plateValue.push({
          type: "p",
          id: generateId(),
          children: parseText(data.text),
        });
        break;
      }
      case "image": {
        const data = block.data as { file: { url: string }; caption?: string };
        const imageElement: TElement = {
          type: "img",
          id: generateId(),
          url: data.file.url,
          children: [{ text: "" }],
        };
        if (data.caption) {
          imageElement.caption = parseText(data.caption);
        }
        plateValue.push(imageElement);
        break;
      }
      case "list": {
        plateValue.push(...convertListBlock(block));
        break;
      }
      case "embed": {
        const data = block.data as { embed: string; caption?: string };
        const embedElement: TElement = {
          type: "media_embed",
          id: generateId(),
          url: data.embed,
          children: [{ text: "" }],
        };
        if (data.caption) {
          embedElement.caption = parseText(data.caption);
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
