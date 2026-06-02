# Fumadocs UI (the default theme of Fumadocs): Inline TOC
URL: /docs/ui/components/inline-toc
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/inline-toc.mdx

Add Inline TOC into your documentation
        


<Installation name="inline-toc" />

## Usage [#usage]

You can use it in your MDX content:

```mdx title="content.mdx"
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';

<InlineTOC items={toc}>Table of Contents</InlineTOC>
```

Or adding it to every page.

```tsx title="page.tsx"
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';

export default function Page() {
  // ...
  return (
    <DocsPage>
      {/* [!code ++] */}
      <InlineTOC items={page.data.toc}>Table of Contents</InlineTOC>
    </DocsPage>
  );
}
```

## Reference [#reference]

<TypeTable
  id="type-table-props.ts-InlineTOCProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-InlineTOCProps&#x22;,
  &#x22;name&#x22;: &#x22;InlineTOCProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;asChild&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;items&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;TOCItemType[]&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;array&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;defaultOpen&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;open&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;disabled&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;onOpenChange&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;((open: boolean) => void) | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;function&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>
