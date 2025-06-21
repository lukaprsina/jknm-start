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