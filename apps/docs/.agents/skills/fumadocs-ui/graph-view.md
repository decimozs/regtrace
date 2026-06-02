# Fumadocs UI (the default theme of Fumadocs): Graph View
URL: /docs/ui/components/graph-view
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/graph-view.mdx

A graph of all pages.
        


## Installation [#installation]

You can install this from CLI:

<CodeBlockTabs defaultValue="npm" groupId="package-manager">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npx @fumadocs/cli add graph-view
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm dlx @fumadocs/cli add graph-view
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn dlx @fumadocs/cli add graph-view
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun x @fumadocs/cli add graph-view
    ```
  </CodeBlockTab>
</CodeBlockTabs>

Enable `extractLinkReferences` on Fumadocs MDX.

```ts title="source.config.ts"
import { defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  docs: {
    postprocess: {
      // [!code ++]
      extractLinkReferences: true,
    },
  },
});
```

## Usage [#usage]

You can use it in MDX files or the layout components (e.g. in `page.tsx`):

```tsx title="page.tsx"
import { GraphView } from '@/components/graph-view';
import { buildGraph } from '@/lib/build-graph';

export function PageBody() {
  return (
    <div>
      <GraphView graph={buildGraph()} />
      {/* ... */}
    </div>
  );
}
```
