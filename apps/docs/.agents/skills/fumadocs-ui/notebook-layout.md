# Fumadocs UI (the default theme of Fumadocs): Notebook Layout
URL: /docs/ui/layouts/notebook
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/layouts/notebook.mdx

A compact version of Docs Layout
        








A compact version of [`<DocsLayout />`](/docs/ui/layouts/docs).

<img alt="Notebook" src="__img0" />

<Customization />

## Usage [#usage]

Enable the notebook layout with `fumadocs-ui/layouts/notebook`.

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'; // [!code highlight]
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
      {children}
    </DocsLayout>
  );
}
```

Make sure to update your page import too:

```tsx title="page.tsx"
import { ... } from 'fumadocs-ui/layouts/docs/page'; // [!code --]
import { ... } from 'fumadocs-ui/layouts/notebook/page'; // [!code ++]
```

## Configurations [#configurations]

The options are inherited from [Docs Layout](/docs/ui/layouts/docs), with minor differences:

* sidebar/navbar cannot be replaced, Notebook layout is more opinionated than the default one.
* additional options (see below).

### Tab Mode [#tab-mode]

Configure the style of [Layout Tabs](/docs/ui/layouts/docs#layout-tabs), see the linked docs for how to add layout tabs.

<img alt="Notebook" src="__img1" />

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      tabMode="navbar" // [!code ++]
      tree={source.getPageTree()}
    >
      {children}
    </DocsLayout>
  );
}
```

### Nav Mode [#nav-mode]

Configure the style of navbar.

Below is an example using [tab mode](#tab-mode) `navbar` & nav mode `top`:

<img alt="Notebook" src="__img2" />

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { nav, ...base } = baseOptions();

  return (
    <DocsLayout
      {...base}
      nav={{ ...nav, mode: 'top' }} // [!code ++]
      tree={source.getPageTree()}
    >
      {children}
    </DocsLayout>
  );
}
```
