https://tanstack.com/router/latest/docs/framework/react/guide/search-params

```tsx
// /routes/shop/products.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fallback, zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const productSearchSchema = z.object({
  page: fallback(z.number(), 1).default(1),
  filter: fallback(z.string(), '').default(''),
  sort: fallback(z.enum(['newest', 'oldest', 'price']), 'newest').default(
    'newest',
  ),
})

export const Route = createFileRoute('/shop/products/')({
  validateSearch: zodValidator(productSearchSchema),
})
```


```tsx
// Somewhere else...

// /components/product-list-sidebar.tsx
const routeApi = getRouteApi('/shop/products')

function ProductList() {
  const routeSearch = routeApi.useSearch()

  // OR

  const { page, filter, sort } = useSearch({
    from: Route.fullPath,
  })

  return <div>...</div>
}
```

Generic component, loose type safety
```tsx
// `page` is a search param that is defined in the __root route and hence available on all routes.
function PageSelector() {
  return (
    <div>
      <Link to="." search={(prev) => ({ ...prev, page: prev.page + 1 })}>
        Next Page
      </Link>
    </div>
  )
}
```

If the generic component is only rendered in a specific subtree of the route tree, you can specify that subtree using from. Here you can omit to='.' if you want.
```tsx
// `page` is a search param that is defined in the /posts route and hence available on all of its child routes.
function PageSelector() {
  return (
    <div>
      <Link
        from="/posts"
        to="."
        search={(prev) => ({ ...prev, page: prev.page + 1 })}
      >
        Next Page
      </Link>
    </div>
  )
}
```

Using loaderDeps to access search params
Imagine a /posts route supports some pagination via search params offset and limit. For the cache to uniquely store this data, we need to access these search params via the loaderDeps function. By explicitly identifying them, each route match for /posts with different offset and limit won't get mixed up!

Once we have these deps in place, the route will always reload when the deps change.
```tsx
// /routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: ({ deps: { offset, limit } }) =>
    fetchPosts({
      offset,
      limit,
    }),
})
```

By passing 10_000 to the staleTime option, we are telling the router to consider the route's data fresh for 10 seconds. This means that if the user navigates to /posts from /about within 10 seconds of the last loader result, the route's data will not be reloaded. If the user then navigates to /posts from /about after 10 seconds, the route's data will be reloaded in the background.
```tsx
// /routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  // Consider the route's data fresh for 10 seconds
  staleTime: 10_000,
})
```

Using the preload flag
The preload property of the loader function is a boolean which is true when the route is being preloaded instead of loaded. Some data loading libraries may handle preloading differently than a standard fetch, so you may want to pass preload to your data loading library, or use it to execute the appropriate data loading logic:
```tsx
// routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loader: async ({ preload }) =>
    fetchPosts({
      maxAge: preload ? 10_000 : 0, // Preloads should hang around a bit longer
    }),
})
```


https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes


Static Route Data -> vsi navbar linki

very important
https://tanstack.com/start/latest/docs/framework/react/learn-the-basics#mutations