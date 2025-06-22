lukaprsina: ## Context
I am rewriting a Slovenian caving blog website with a built-in PlateJS editor to edit the posts (it works like shadcn/ui, you download the files into your project directly). I use BunJS as the package manager, the new Tanstack Start with ReactJS (also Tanstack Router, Tanstack Query), shadcn/ui and DrizzleORM connected to Supabase Cloud.

## Task
Please read the Tanstack Router (and maybe Start) documentation, I have the whole project cloned in my `vendor` folder. Then advise me my project architecture:
- home route (/) has an infinite query, fetched from Algolia cloud
- there is a search button in the header that opens shadcn/ui Command menu (based on cmdk)
- there is a chevron button called Filters, which opens an accordion of various filters
- both will use Tanstack Routers excellent typesafe search to query via the algolia@v5 js api
- but what is the cleanest way to architect this based on the documentation?
- Algolia also stores the URL slug of every post (example title to slug: "Našli novo jamo" -> "nasli-novo-jamo")
- when creating routes, do I rely on the ID of the post or the URL (you know the tradeoffs, ID's are ugly, URL needs extra maintanence when renaming the post) - the route could be `/novica/$id.tsx` or `/novica/$slug.tsx` - also think about Tanstack directory grouping
- the site admin (the only one able to login) - will be able to edit the site using the `/novica/$slug/edit.tsx` route
- files/images/videos from the editor will be uploaded to backblaze B2
- I use Vercel, I can use rewrites as a reverse-proxy to B2 so the URL's will be user friendly
- how should I store the file? do I store the file as `article_name/file_name`, or `article_id/file_name`, `article_id/file_id`or just a single id? 
- again, the tradeoffs are UX when downloading the file, opening the image in a new tab and so on... all the way to: having to rename the file URL's in the editor (!) when you change the post title

These are heavy architecture decisions. Think hard about them, list pros/cons when necesarry, but don't be afraid to put down bad ideas. And again, read at least the Tanstack Router docs about data, navigation and routes (you can read most of `vendor\router\docs\router\framework\react\guide\*.md` files).

What are your thoughts?


#codebase

GitHub Copilot: Of course. Based on the Tanstack Router documentation and the context of your project, here are my architectural recommendations.

### 1. Search and Filtering Architecture

For a clean, scalable, and shareable search experience, you should leverage Tanstack Router's URL search parameter management. The state of your search input and filters should live in the URL.

**Recommendation:**

1.  **Centralize Search State on a Parent Route:** Define your search parameter validation on a high-level route, like `src/routes/__root.tsx`, so the search state is available globally. This makes it easy for any component to read or update the search query.

2.  **Use a Schema for Validation:** Define a schema for all possible search and filter parameters using a library like Zod. This provides type safety and default values for your search state. The `validateSearch` option is perfect for this, as detailed in the search-params.md documentation.

    ````tsx
    // filepath: src/routes/__root.tsx
    import { z } from 'zod';
    import { zodValidator } from '@tanstack/zod-adapter'; // You may need to install this adapter
    // ... existing code ...

    const searchSchema = z.object({
      q: z.string().optional().catch(undefined),
      // Example filters
      category: z.string().optional().catch(undefined),
      minDepth: z.number().optional().catch(undefined),
      hasWater: z.boolean().optional().catch(undefined),
    }).default({});

    export const Route = createRootRouteWithContext</*...*/>()({
      validateSearch: zodValidator(searchSchema),
      // ... existing code ...
    });
    ````

3.  **Decouple UI from Data Fetching:**
    *   Your **Search Command Menu** and **Filter Accordion** components should not manage state. They should only be responsible for navigating and updating the URL's search parameters. Use the `useNavigate` hook or the `<Link>` component.

        ````tsx
        // Example in your Filter component
        import { useNavigate } from '@tanstack/react-router';
        import { Checkbox } from '~/components/ui/checkbox';

        function WaterFilter() {
          const navigate = useNavigate({ from: '/' });
          const { hasWater } = Route.useSearch(); // Assuming Route is imported from __root.tsx

          return (
            <Checkbox
              checked={hasWater}
              onCheckedChange={(checked) => {
                navigate({
                  search: (prev) => ({ ...prev, hasWater: !!checked || undefined }),
                  // Using undefined removes the param from the URL
                });
              }}
            />
          );
        }
        ````

    *   Your **Home Route** (`src/routes/index.tsx`) will read the validated search params using the `useSearch` hook and pass them to your Algolia infinite query hook. TanStack Query will automatically refetch data when the search params in the query key change.

        ````tsx
        // filepath: src/routes/index.tsx
        // ... existing code ...
        function Home() {
          const searchParams = Route.useSearch();
          const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
            queryKey: ['articles', searchParams],
            queryFn: ({ pageParam = 0 }) => fetchArticlesFromAlgolia({ ...searchParams, page: pageParam }),
            // ...
          });
          // ...
        }
        ````

This approach creates a single source of truth (the URL) for your search state, making it robust and bookmarkable.

### 2. Routing and URL Strategy

Choosing between IDs and slugs involves a tradeoff between permanent, stable links and user-friendly, SEO-optimized URLs.

**Recommendation: Use Slugs with a Fallback Strategy.**

Slugs are better for user experience and SEO. The main drawback is handling changes.

*   **Pros:** Human-readable, SEO-friendly.
*   **Cons:** Can change if the post title is edited, potentially breaking links.

**Implementation:**

1.  **Route Structure:** Use slugs for your public-facing routes. For organization, you can group related routes.
    *   `src/routes/novice/$slug.tsx` (Public post view)
    *   `src/routes/novice/$slug.edit.tsx` (Admin edit view, protected by a `beforeLoad` auth check)

2.  **Handling Slug Changes:** The key is to treat the `id` as the immutable identifier internally while exposing the `slug` externally.
    *   When a post title changes, generate a new slug but **do not discard the old one**. Store previous slugs in a separate table or a JSON array column in your `articles` table (e.g., `previous_slugs`).
    *   In the loader for `src/routes/novice/$slug.tsx`, first query by the current slug. If nothing is found, query the `previous_slugs`. If a match is found there, perform a 301 redirect to the URL with the new, canonical slug. This preserves link equity and prevents broken links.

**Alternative: Hybrid ID-Slug URL**

A highly robust alternative is to combine both the ID and the slug in the URL.

*   **URL Structure:** `/novice/123-nasli-novo-jamo`
*   **Route File:** `src/routes/novice/$postId.tsx` (you would parse the param to extract the ID).
*   **Pros:**
    *   The link is permanent. The canonical part of the URL is the ID, which never changes.
    *   If the slug part of the URL changes, the link still resolves to the correct post. No redirects are needed.
    *   Still reasonably SEO-friendly.
*   **Cons:**
    *   Slightly less clean than a pure slug URL.

This hybrid approach is common and offers a great balance of stability and user-friendliness.

### 3. File Storage and URL Strategy

This is critical for long-term maintenance. The URLs for your media assets stored in the editor's content should be permanent.

**Recommendation: Use Immutable, Non-descriptive IDs for File Paths.**

Never use the article's slug or the file's original name directly in the storage path. This creates a maintenance nightmare if a post title changes.

1.  **Database Schema:** Create a dedicated `media` table in your database.
    *   `id`: A unique, immutable ID (e.g., `nanoid()` or `uuid`). This will be the public identifier.
    *   `article_id`: Foreign key to the `articles` table.
    *   `original_filename`: The original name of the file, for UX purposes.
    *   `mime_type`, `size`, `storage_path`, etc.

2.  **Storage Path (Backblaze B2):** Use a structure based on immutable IDs.
    *   **Path:** `articles/{article_id}/{media_id}`
    *   This groups assets by article for easy management in B2 but uses a unique ID for the file itself.

3.  **URL in Editor Content:** The URL inserted into the PlateJS editor content should be clean and permanent.
    *   **URL:** `/media/{media_id}`

4.  **Serving Files (Vercel):** Use a Vercel Serverless Function to act as a proxy to B2. A simple rewrite is not enough if you want to control the download filename.
    *   A request to `https://www.jknm.si/media/abc123xyz` hits your function.
    *   The function looks up `abc123xyz` in your `media` table to get the storage path and original filename.
    *   It fetches the file from B2.
    *   It streams the file back to the client with the correct `Content-Type` and, crucially, the `Content-Disposition` header to provide a user-friendly download filename.
        *   `Content-Disposition: inline; filename="original-descriptive-name.jpg"`

This architecture completely decouples your file URLs from both the article's name and the file's name, ensuring that links in your posts will never break, while still providing an excellent user experience.