# Fumadocs UI (the default theme of Fumadocs): Zoomable Image
URL: /docs/ui/components/image-zoom
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/image-zoom.mdx

Allow zoom-in images in your documentation
        


<Installation name="image-zoom" />

## Usage [#usage]

Replace `img` with `ImageZoom` in your MDX components.

```tsx title="components/mdx.tsx"
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import defaultComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    // [!code ++]
    img: (props) => <ImageZoom {...(props as any)} />,
    ...components,
  } satisfies MDXComponents;
}
```

Now image zoom will be automatically enabled on all images.

```mdx
![Test](/banner.png)
```

### Image Optimization [#image-optimization]

On Next.js, a default [`sizes` property](https://nextjs.org/docs/app/api-reference/components/image#sizes) will be defined for `<Image />` component if not specified.
