# Fumadocs UI (the default theme of Fumadocs): Docs Layout
URL: /docs/ui/layouts/docs
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/layouts/docs.mdx

The layout of documentation
        








The layout of documentation pages, it includes a sidebar and **mobile-only** navbar/header.

<img alt="preview" src="__img0" />

<Customization />

## Usage [#usage]

Pass your page tree to the component.

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions()} tree={tree}>
      {children}
    </DocsLayout>
  );
}
```

See detailed docs for [`links`](/docs/ui/layouts/links) and [`nav`](/docs/ui/layouts/nav) options.

### References [#references]

<TypeTable
  id="type-table-props.ts-$Fumadocs"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-$Fumadocs&#x22;,
  &#x22;name&#x22;: &#x22;$Fumadocs&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;tree&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;Root&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;sidebar&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;SidebarOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;tabMode&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;\&#x22;top\&#x22; | \&#x22;auto\&#x22; | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;tabs&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;false | LayoutTab[] | GetLayoutTabsOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;containerProps&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.HTMLAttributes<HTMLDivElement> | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;slots&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;Partial<DocsSlots> | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;Partial<object>&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;githubUrl&#x22;,
      &#x22;description&#x22;: &#x22;GitHub url&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;links&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;LinkItemType[] | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;array&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;nav&#x22;,
      &#x22;description&#x22;: &#x22;navigation config&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;NavOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;themeSwitch&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;ThemeSwitchOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;searchToggle&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;SearchToggleOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;i18n&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;deprecated&#x22;,
          &#x22;text&#x22;: &#x22;this is now optional for i18n setups, you can still customize language switch from `slots`.&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;boolean | I18nConfig<string> | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: true
    }
  ]
}"
/>

## Sidebar [#sidebar]

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

<DocsLayout
  sidebar={{
    enabled: true,
  }}
/>;
```

### Sidebar Items [#sidebar-items]

Customize sidebar navigation links.

<div className="flex justify-center items-center *:max-w-[200px] bg-linear-to-br from-fd-primary/10 rounded-xl border">
    <img alt="Sidebar" src="__img1" />
</div>

Sidebar items are rendered from the page tree you passed to `<DocsLayout />`.

For page tree from [`loader()`](/docs/headless/source-api), it generates the tree from your file structure, see [available patterns](/docs/page-conventions).

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      // other props
    >
      {children}
    </DocsLayout>
  );
}
```

You may hardcode it too:

```tsx title="layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={{
        name: 'docs',
        children: [],
      }}
      // other props
    >
      {children}
    </DocsLayout>
  );
}
```

### Layout Tabs (Dropdown) [#layout-tabs]

Layout Tabs are folders with tab-like behaviours, only the content of opened tab will be visible.

<div className="flex justify-center items-center *:max-w-[360px] bg-linear-to-br from-fd-primary/10 rounded-xl border">
    <img alt="Layout Tabs" src="__img2" />
</div>

By default, the tab trigger will be displayed as a **Dropdown** component (hidden unless one of its items is active).

You can add items by marking folders as [Root Folders](/docs/page-conventions#root-folder), create a `meta.json` file in the folder:

```json title="content/docs/my-folder/meta.json"
{
  "title": "Name of Folder",
  "description": "The description of root folder (optional)",
  "root": true
}
```

Or specify them explicitly:

```tsx title="/app/docs/layout.tsx"
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

<DocsLayout
  tabs={[
    {
      title: 'Components',
      description: 'Hello World!',
      // active for `/docs/components` and sub routes like `/docs/components/button`
      url: '/docs/components',

      // optionally, you can specify a set of urls which activates the item
      // urls: new Set(['/docs/test', '/docs/components']),
    },
  ]}
/>;
```

Set it to `false` to disable:

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

<DocsLayout tabs={false} />;
```

<Callout title="Want further customizations?">
  You can specify a `banner` to the [Docs Layout](/docs/ui/layouts/docs) component.

  ```tsx
  import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
  import type { ReactNode } from 'react';
  import { baseOptions } from '@/lib/layout.shared';
  import { source } from '@/lib/source';

  export default function Layout({ children }: { children: ReactNode }) {
    return (
      <DocsLayout
        {...baseOptions()}
        tree={source.getPageTree()}
        sidebar={{
          // [!code ++]
          banner: <div>Hello World</div>,
        }}
      >
        {children}
      </DocsLayout>
    );
  }
  ```
</Callout>

#### Decoration [#decoration]

Change the icon/styles of layout tabs.

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

<DocsLayout
  tabs={{
    transform: (option, node) => ({
      ...option,
      icon: <MyIcon />,
    }),
  }}
/>;
```

### Sidebar Components [#sidebar-components]

You can replace certain components for rendering page tree.

<CodeBlockTabs defaultValue="layout.tsx">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="layout.tsx">
      layout.tsx
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="layout.client.tsx">
      layout.client.tsx
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="layout.tsx">
    ```tsx
    import { DocsLayout } from 'fumadocs-ui/layouts/docs';
    import { SidebarSeparator } from './layout.client';

    <DocsLayout
      sidebar={{
        enabled: true,
        components: {
          Separator: SidebarSeparator,
        },
      }}
    />;
    ```
  </CodeBlockTab>

  <CodeBlockTab value="layout.client.tsx">
    ```tsx
    'use client';
    import * as Base from 'fumadocs-ui/components/sidebar/base';

    export function SidebarSeparator({ className, style, children, ...props }: ComponentProps<'p'>) {
      const depth = Base.useFolderDepth();

      return (
        <Base.SidebarSeparator
          className={cn('[&_svg]:size-4 [&_svg]:shrink-0', className)}
          style={{
            paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))`,
            ...style,
          }}
          {...props}
        >
          {children}
        </Base.SidebarSeparator>
      );
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

### References [#references-1]

<TypeTable
  id="type-table-props.ts-SidebarProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-SidebarProps&#x22;,
  &#x22;name&#x22;: &#x22;SidebarProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;footer&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;enabled&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;component&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;deprecated&#x22;,
          &#x22;text&#x22;: &#x22;use `slots.sidebar` instead.&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: true
    },
    {
      &#x22;name&#x22;: &#x22;tabMode&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;deprecated&#x22;,
          &#x22;text&#x22;: &#x22;use layout-level `tabMode` option instead.&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;\&#x22;auto\&#x22; | \&#x22;top\&#x22; | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: true
    },
    {
      &#x22;name&#x22;: &#x22;tabs&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;deprecated&#x22;,
          &#x22;text&#x22;: &#x22;use layout-level `tabs` option instead.&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;false | LayoutTab[] | GetLayoutTabsOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: true
    },
    {
      &#x22;name&#x22;: &#x22;components&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;Partial<SidebarPageTreeComponents> | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;Partial<object>&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;banner&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;collapsible&#x22;,
      &#x22;description&#x22;: &#x22;Support collapsing the sidebar on desktop mode&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;true&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;defaultOpenLevel&#x22;,
      &#x22;description&#x22;: &#x22;Open folders by default if their level is lower or equal to a specific level\n(Starting from 1)&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;0&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;number | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;number&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;prefetch&#x22;,
      &#x22;description&#x22;: &#x22;Prefetch links, default behaviour depends on your React.js framework.&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

## Advanced [#advanced]

### Prefetching [#prefetching]

Fumadocs use the `<Link />` component of your React framework, and keep their default prefetch behaviours.

On Vercel, prefetch requests may cause a higher usage of serverless functions and Data Cache.
It can also hit the limits of some other hosting platforms.

You can disable prefetching to reduce the amount of prefetch requests, or enable explicitly:

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

<DocsLayout sidebar={{ prefetch: false }} />;
```

### The Layout System [#the-layout-system]

Handling layout is challenging, Fumadocs UI needed an approach that is:

* **Composable:** Layout components should manage their position and size effortlessly, ideally in place.
* **Flexible:** The system should avoid reliance on fixed values or heights, enabling seamless integration of external components, such as AI chat interfaces.
* **Cohesive:** Components should respond to changes in others, for instance, by animating sidebar collapses.
* **Predictable:** Layout properties should remain centralized, allowing the final result to be readily anticipated from the source code.
* **Compatible:** The solution should work on older browsers by leveraging only Baseline Widely Available CSS features.

Fumadocs UI does this with a grid system:

```css
#nd-docs-layout {
  grid-template:
    'sidebar header toc'
    'sidebar toc-popover toc'
    'sidebar main toc' 1fr / minmax(var(--fd-sidebar-col), 1fr) minmax(0, var(--fd-page-col))
    minmax(min-content, 1fr);

  --fd-docs-row-1: var(--fd-banner-height, 0px);
  --fd-docs-row-2: calc(var(--fd-docs-row-1) + var(--fd-header-height));
  --fd-docs-row-3: calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height));
  --fd-sidebar-col: var(--fd-sidebar-width);
  --fd-page-col: calc(
    var(--fd-layout-width, 97rem) - var(--fd-sidebar-width) - var(--fd-toc-width)
  );
  --fd-sidebar-width: 0px;
  --fd-toc-width: 0px;

  --fd-header-height: 0px;
  --fd-toc-popover-height: 0px;
}
```

* The layout container uses grid layout, `grid-template` is set to produce predictable result.
* `--fd-docs-row-*` define the top offset of each row, allowing elements with `position: sticky` to hook a correct top offset.
* `--fd-*-width` and `--fd-*-height` are set by layout components using CSS, they are essential to maintain the grid structure, or calculating `--fd-docs-row-*`.
* `--fd-*-col` are dynamic values, updated as state changes (e.g. `--fd-sidebar-col` becomes `0px` when the sidebar is collapsed).

Both default and the notebook layout utilize this system.
