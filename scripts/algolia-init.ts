import { algoliasearch } from "algoliasearch";
import { readFile } from "fs/promises";
import type { Root, RootContent } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";
import { join } from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { z } from "zod/v4";
import { ArticleStatusValidator } from "~/lib/db/schema/article.schema";

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!,
);

// Zod validator for Algolia objects
const AlgoliaObjectSchema = z.object({
  // searchable
  objectID: z.string(), // copied from db_id
  title: z.string(),
  authors: z.array(z.string()).optional(), // authors are indexed, can be used for filtering
  permalink: z.url(),
  content: z.string(),
  section: z.string(),
  status: ArticleStatusValidator,
  // unsearchable, just for filtering
  old_id: z.number().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
  published_at: z.date().nullable(),
  archived_at: z.date().nullable(),
  migrated_at: z.date().nullable(),
});

type AlgoliaObject = z.infer<typeof AlgoliaObjectSchema>;

const object_template: Omit<AlgoliaObject, "content" | "section"> = {
  // searchable
  objectID: "1",
  title: "Plate Editor Documentation",
  authors: ["Jane Doe", "John Smith"],
  permalink: "https://www.jknm.si/docs/plate-editor",
  status: "published",
  // unsearchable, just for filtering
  old_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  published_at: new Date(),
  archived_at: null,
  deleted_at: null,
  migrated_at: null,
};

interface DocumentSection {
  section: string;
  content: string;
}

// Custom function to serialize markdown nodes while preserving newlines
const serializeContent = (nodes: RootContent[]): string => {
  return toMarkdown({ type: "root", children: nodes });
};

// Parse markdown and split by H2 headings
const parseAndSplitMarkdown = async (filePath: string): Promise<DocumentSection[]> => {
  const markdownContent = await readFile(filePath, "utf-8");

  const processor = unified().use(remarkParse).use(remarkFrontmatter);

  const tree = processor.parse(markdownContent) as Root;

  const sections: DocumentSection[] = [];
  let currentSection = "";
  let currentContent: RootContent[] = [];

  // Process each node in the markdown tree
  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) {
      // H1 heading - if we have accumulated content, save it as a section
      if (currentContent.length > 0) {
        sections.push({
          section: currentSection,
          content: serializeContent(currentContent).trim(),
        });
        currentContent = [];
      }
      currentSection = toString(node);
      currentContent.push(node);
    } else if (node.type === "heading" && node.depth === 2) {
      // H2 heading - save previous section if it exists
      if (currentContent.length > 0) {
        sections.push({
          section: currentSection,
          content: serializeContent(currentContent).trim(),
        });
        currentContent = [];
      }
      currentSection = toString(node);
      currentContent.push(node);
    } else {
      // Regular content - add to current section
      currentContent.push(node);
    }
  }

  // Don't forget the last section
  if (currentContent.length > 0) {
    sections.push({
      section: currentSection,
      content: serializeContent(currentContent).trim(),
    });
  }

  return sections;
};

// Create Algolia objects from sections
const createAlgoliaObjects = (sections: DocumentSection[]): AlgoliaObject[] => {
  return sections.map((section) => {
    const algoliaObject: AlgoliaObject = {
      ...object_template,
      section: section.section,
      content: section.content,
    };

    // Validate the object
    return AlgoliaObjectSchema.parse(algoliaObject);
  });
};

// Fetch and index objects in Algolia
const processRecords = async () => {
  try {
    const markdownPath = join(process.cwd(), "scripts", "plate.md");
    console.log(`Loading markdown from: ${markdownPath}`);

    const sections = await parseAndSplitMarkdown(markdownPath);
    console.log(`Found ${sections.length} sections`);

    const algoliaObjects = createAlgoliaObjects(sections);
    console.log(`Created ${algoliaObjects.length} Algolia objects`);

    // Log the objects for debugging
    algoliaObjects.forEach((obj, index) => {
      console.log(`\nSection ${index + 1}:`);
      console.log(`Title: ${obj.title}`);
      console.log(`Section: ${obj.section}`);
      console.log(`Content preview: ${obj.content.substring(0, 100)}...`);
    });

    const result = await client.saveObjects({
      indexName: "articles",
      objects: algoliaObjects,
    });

    return result;
  } catch (error) {
    console.error("Error processing records:", error);
    throw error;
  }
};

processRecords()
  .then((result) => {
    console.log("Successfully indexed objects!");
    console.log(`Result:`, result);
  })
  .catch((err) => console.error(err));
