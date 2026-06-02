# Fumadocs UI (the default theme of Fumadocs): Code Block (Dynamic)
URL: /docs/ui/components/dynamic-codeblock
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/dynamic-codeblock.mdx

A codeblock that also highlights code
        


## Usage [#usage]

### Client Component [#client-component]

```tsx
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

export function MyComp() {
  const code = `console.log("Hello World")`;

  return <DynamicCodeBlock lang="ts" code={code} />;
}
```

Unlike the MDX [`CodeBlock`](/docs/ui/components/codeblock) component, this is a client component that can be used without MDX.
It highlights the code with Shiki and use the default component to render it.

Features:

* using React.js 19 Suspense.
* can be pre-rendered on server.
* load languages and themes on browser lazily.

#### Options [#options]

```tsx
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

<DynamicCodeBlock
  lang="ts"
  code='console.log("Hello World")'
  options={{
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    components: {
      // override components (e.g. `pre` and `code`)
    },
    // other Shiki options
  }}
/>;
```

### Server Component [#server-component]

For a server component equivalent, you can use the RSC version:

```tsx
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';

<ServerCodeBlock
  lang="ts"
  code='console.log("Hello World")'
  options={{
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    components: {
      // override components (e.g. `pre` and `code`)
    },
    // other Shiki options
  }}
/>;
```
