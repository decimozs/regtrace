# Fumadocs UI (the default theme of Fumadocs): Navbar
URL: /docs/ui/layouts/nav
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/layouts/nav.mdx

Navbar/header configurations.
        


## Configurations [#configurations]

Options for navbar (header).

<TypeTable
  id="type-table-props.ts-$Fumadocs"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-$Fumadocs&#x22;,
  &#x22;name&#x22;: &#x22;$Fumadocs&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
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
      &#x22;name&#x22;: &#x22;title&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode | React.FC<React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>>&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;url&#x22;,
      &#x22;description&#x22;: &#x22;Redirect url of title&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;'/'&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;transparentMode&#x22;,
      &#x22;description&#x22;: &#x22;Use transparent background&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;none&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;\&#x22;always\&#x22; | \&#x22;top\&#x22; | \&#x22;none\&#x22; | undefined&#x22;,
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
          &#x22;text&#x22;: &#x22;use `slots.header` instead.&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: true
    }
  ]
}"
/>

### Transparent Mode [#transparent-mode]

To make the navbar background transparent, you can configure transparent mode.

<CodeBlockTabs defaultValue="All">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="All">
      All
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Home Layout">
      Home Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="All">
    ```tsx  title="lib/layout.shared.tsx"
    import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

    export function baseOptions(): BaseLayoutProps {
      return {
        nav: {
          title: 'My App',
          // [!code ++]
          transparentMode: 'top',
        },
      };
    }
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Home Layout">
    ```tsx
    import { baseOptions } from '@/lib/layout.shared';
    import { HomeLayout } from 'fumadocs-ui/layouts/home';
    import type { ReactNode } from 'react';

    export default function Layout({ children }: { children: ReactNode }) {
      const base = baseOptions();
      return (
        <HomeLayout
          {...base}
          nav={{
            ...base.nav,
            // [!code ++]
            transparentMode: 'top',
          }}
        >
          {children}
        </HomeLayout>
      );
    }
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Docs Layout">
    ```tsx
    import { baseOptions } from '@/lib/layout.shared';
    import { DocsLayout } from 'fumadocs-ui/layouts/docs';
    import type { ReactNode } from 'react';

    export default function Layout({ children }: { children: ReactNode }) {
      const base = baseOptions();
      return (
        <DocsLayout
          {...base}
          nav={{
            ...base.nav,
            // [!code ++]
            transparentMode: 'top',
          }}
        >
          {children}
        </DocsLayout>
      );
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

| Mode     | Description                              |
| -------- | ---------------------------------------- |
| `always` | Always use a transparent background      |
| `top`    | When at the top of page                  |
| `none`   | Disable transparent background (default) |

### Replace Navbar [#replace-navbar]

To replace the navbar in different layouts, set `nav.component` to your own component.

<CodeBlockTabs defaultValue="All">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="All">
      All
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Home Layout">
      Home Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="All">
    ```tsx  title="lib/layout.shared.tsx"
    import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

    export function baseOptions(): BaseLayoutProps {
      return {
        nav: {
          // [!code ++]
          component: <CustomNavbar />,
        },
      };
    }
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Home Layout">
    ```tsx
    import { baseOptions } from '@/lib/layout.shared';
    import { HomeLayout } from 'fumadocs-ui/layouts/home';
    import type { ReactNode } from 'react';

    export default function Layout({ children }: { children: ReactNode }) {
      const base = baseOptions();
      return (
        <HomeLayout
          {...base}
          nav={{
            ...base.nav,
            // [!code ++]
            component: <CustomNavbar />,
          }}
        >
          {children}
        </HomeLayout>
      );
    }
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Docs Layout">
    ```tsx
    import { baseOptions } from '@/lib/layout.shared';
    import { DocsLayout } from 'fumadocs-ui/layouts/docs';
    import type { ReactNode } from 'react';

    export default function Layout({ children }: { children: ReactNode }) {
      const base = baseOptions();
      return (
        <DocsLayout
          {...base}
          nav={{
            ...base.nav,
            // [!code ++]
            component: <CustomNavbar />,
          }}
        >
          {children}
        </DocsLayout>
      );
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

Fumadocs uses **CSS Variables** to share the size of layout components, and fit each layout component into appropriate position.

You need to override `--fd-nav-height` to the exact height of your custom navbar, this can be done with a CSS stylesheet (e.g. in `global.css`):

```css
:root {
  --fd-nav-height: 80px !important;
}
```
