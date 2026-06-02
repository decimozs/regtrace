# Fumadocs UI (the default theme of Fumadocs): Docs Page
URL: /docs/ui/layouts/page
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/layouts/page.mdx

A page in your documentation
        


Page is the base element of a documentation, it includes Table of contents,
Footer, and Breadcrumb.

<Customization />

## Usage [#usage]

Import it according to your layout.

<CodeBlockTabs defaultValue="Docs Layout">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Notebook Layout">
      Notebook Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="Docs Layout">
    ```tsx title="page.tsx" 
    import { DocsPage, DocsDescription, DocsTitle, DocsBody } from 'fumadocs-ui/layouts/docs/page';

    <DocsPage>
      <DocsTitle>title</DocsTitle>
      <DocsDescription>description</DocsDescription>
      <DocsBody>
        <h2>This heading looks good!</h2>
        It applies the Typography styles, wrap your content here.
      </DocsBody>
    </DocsPage>;
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Notebook Layout">
    ```tsx title="page.tsx" 
    import { DocsPage, DocsDescription, DocsTitle, DocsBody } from 'fumadocs-ui/layouts/notebook/page';

    <DocsPage>
      <DocsTitle>title</DocsTitle>
      <DocsDescription>description</DocsDescription>
      <DocsBody>
        <h2>This heading looks good!</h2>
        It applies the Typography styles, wrap your content here.
      </DocsBody>
    </DocsPage>;
    ```
  </CodeBlockTab>
</CodeBlockTabs>

<Callout type="info" title="Good to know">
  Instead of rendering the title with `DocsTitle` in `page.tsx`, you can put the title into MDX file.
  This will render the title in the MDX body.
</Callout>

### Page Actions [#page-actions]

Show GitHub link, and shortcut links for AIs.

```tsx
import { DocsPage, ViewOptionsPopover } from 'fumadocs-ui/layouts/<layout>/page';

const githubUrl = `https://github.com/fuma-nama/fumadocs/blob/main/content/docs/${page.path}`

<DocsPage>
  <ViewOptionsPopover githubUrl={githubUrl} />
</DocsPage>;
```

### Last Updated Time [#last-updated-time]

Display last updated time of the page.

```tsx
import { DocsPage, PageLastUpdate } from 'fumadocs-ui/layouts/<layout>/page';

const lastModifiedTime: Date | undefined;

<DocsPage>
  {/* Other content */}
  {lastModifiedTime && <PageLastUpdate date={lastModifiedTime} />}
</DocsPage>;
```

For `lastModifiedTime`, you can possibly use different version controls like Github or a CMS.

<Tabs items="['Fumadocs MDX', 'GitHub API']">
  <Tab>
    You can enable [`lastModified`](/docs/mdx/last-modified).

    ```tsx
    import { source } from '@/lib/source';
    const page = source.getPage(['...']);

    const lastModifiedTime = page.data.lastModified;
    ```
  </Tab>

  <Tab>
    For Github hosted documents, you can use
    the [`getGithubLastEdit`](/docs/headless/utils/git-last-edit) utility.

    ```tsx
    import { getGithubLastEdit } from 'fumadocs-core/content/github';

    const lastModifiedTime = await getGithubLastEdit({
      owner: 'fuma-nama',
      repo: 'fumadocs',
      // file path in Git
      path: `content/docs/${page.path}`,
    });
    ```
  </Tab>
</Tabs>

## Configurations [#configurations]

### Full Mode [#full-mode]

To extend the page to fill up all available space, pass `full` to the page component.
This will force TOC to be shown as a popover.

```tsx
import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';

<DocsPage full>...</DocsPage>;
```

### Table of Contents [#table-of-contents]

An overview of all the headings in your article, it requires an array of headings.

For Markdown and MDX documents, You can obtain it using the
[TOC Utility](/docs/headless/utils/get-toc). Content sources like Fumadocs MDX offer this out-of-the-box.

```tsx
import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';

<DocsPage toc={headings}>...</DocsPage>;
```

You can customize it with `tableOfContent`, or with `tableOfContentPopover` on smaller devices.

```tsx title="page.tsx"
import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';

return (
  <DocsPage tableOfContent={options} tableOfContentPopover={options}>
    ...
  </DocsPage>
);
```

<TypeTable
  id="type-table-temp.ts-$Fumadocs"
  type="{
  &#x22;id&#x22;: &#x22;temp.ts-$Fumadocs&#x22;,
  &#x22;name&#x22;: &#x22;$Fumadocs&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;container&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;DetailedHTMLProps<object, object>&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;header&#x22;,
      &#x22;description&#x22;: &#x22;Custom content in TOC container, before the main TOC&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;footer&#x22;,
      &#x22;description&#x22;: &#x22;Custom content in TOC container, after the main TOC&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;style&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;\&#x22;normal\&#x22; | \&#x22;clerk\&#x22; | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;list&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> | TOCItemsProps | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

#### Style [#style]

You can choose another style for TOC, like `clerk` inspired by [https://clerk.com](https://clerk.com):

```tsx
import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';

<DocsPage
  tableOfContent={{
    style: 'clerk',
  }}
>
  ...
</DocsPage>;
```

#### Replace TOC [#replace-toc]

To replace the component:

<CodeBlockTabs defaultValue="page.tsx">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="page.tsx">
      page.tsx
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="my-toc.tsx">
      my-toc.tsx
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="page.tsx">
    ```tsx
    import { TOCProvider, TOC, TOCPopover } from './my-toc';

    return (
      <DocsPage
        slots={{
          toc: {
            provider: TOCProvider,
            main: TOC,
            popover: TOCPopover,
          },
        }}
      >
        ...
      </DocsPage>
    );
    ```
  </CodeBlockTab>

  <CodeBlockTab value="my-toc.tsx">
    ```tsx
    'use client';
    import type {
      TOCProps,
      TOCPopoverProps,
      TOCProviderProps,
    } from 'fumadocs-ui/layouts/<layout>/page/slots/toc';

    export function TOCProvider({ toc, children }: TOCProviderProps) {
      // receive TOC items, you can pass it down via React contexts
      console.log(toc);
      return children;
    }

    export function TOC(props: TOCProps) {
      return <div>Hello World</div>;
    }

    export function TOCPopover(props: TOCPopoverProps) {
      return <div>Popover</div>;
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

You can start from the default implementation with Fumadocs CLI:

<CodeBlockTabs defaultValue="Docs Layout">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Notebook Layout">
      Notebook Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Flux Layout">
      Flux Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="Docs Layout">
    ```bash
    npx @fumadocs/cli add slots/docs/page/toc
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Notebook Layout">
    ```bash
    npx @fumadocs/cli add slots/notebook/page/toc
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Flux Layout">
    ```bash
    npx @fumadocs/cli add slots/flux/page/toc
    ```
  </CodeBlockTab>
</CodeBlockTabs>

### Footer [#footer]

Footer is a navigation element that has two buttons to jump to the next and previous pages. When not specified, it shows the neighbour pages found from page tree.

Customize the footer with the `footer` prop:

```tsx
import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';

<DocsPage footer={options}>...</DocsPage>;
```

<TypeTable
  id="type-table-temp.ts-$Fumadocs"
  type="{
  &#x22;id&#x22;: &#x22;temp.ts-$Fumadocs&#x22;,
  &#x22;name&#x22;: &#x22;$Fumadocs&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;items&#x22;,
      &#x22;description&#x22;: &#x22;Items including information for the next and previous page&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;{ previous?: Item; next?: Item; } | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

#### Replace Footer [#replace-footer]

To replace the component:

<CodeBlockTabs defaultValue="page.tsx">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="page.tsx">
      page.tsx
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="my-footer.tsx">
      my-footer.tsx
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="page.tsx">
    ```tsx
    import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';
    import { Footer } from './my-footer';

    <DocsPage
      slots={{
        footer: Footer,
      }}
    />;
    ```
  </CodeBlockTab>

  <CodeBlockTab value="my-footer.tsx">
    ```tsx
    'use client';
    import type { FooterProps } from 'fumadocs-ui/layouts/<layout>/page/slots/footer';

    export function Footer(props: FooterProps) {
      return <div>Hello World</div>;
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

You can start from the default implementation with Fumadocs CLI:

<CodeBlockTabs defaultValue="Docs Layout">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Notebook Layout">
      Notebook Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Flux Layout">
      Flux Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="Docs Layout">
    ```bash
    npx @fumadocs/cli add slots/docs/page/footer
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Notebook Layout">
    ```bash
    npx @fumadocs/cli add slots/notebook/page/footer
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Flux Layout">
    ```bash
    npx @fumadocs/cli add slots/flux/page/footer
    ```
  </CodeBlockTab>
</CodeBlockTabs>

### Breadcrumb [#breadcrumb]

A navigation element, shown only when user is navigating in folders.

Customize the breadcrumb with the `breadcrumb` option:

```tsx
import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';

<DocsPage breadcrumb={options}>...</DocsPage>;
```

<TypeTable
  id="type-table-temp.ts-$Fumadocs"
  type="{
  &#x22;id&#x22;: &#x22;temp.ts-$Fumadocs&#x22;,
  &#x22;name&#x22;: &#x22;$Fumadocs&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;includeRoot&#x22;,
      &#x22;description&#x22;: &#x22;Include the root folders in the breadcrumb items array.&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;false&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;boolean | { url: string; } | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;includePage&#x22;,
      &#x22;description&#x22;: &#x22;Include the page itself in the breadcrumb items array&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;false&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;includeSeparator&#x22;,
      &#x22;description&#x22;: &#x22;Count separator as an item&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;defaultValue&#x22;,
          &#x22;text&#x22;: &#x22;false&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

#### Replace Breadcrumb [#replace-breadcrumb]

To replace the component:

<CodeBlockTabs defaultValue="page.tsx">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="page.tsx">
      page.tsx
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="my-breadcrumb.tsx">
      my-breadcrumb.tsx
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="page.tsx">
    ```tsx
    import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';
    import { Breadcrumb } from './my-breadcrumb';

    <DocsPage
      slots={{
        breadcrumb: Breadcrumb,
      }}
    />;
    ```
  </CodeBlockTab>

  <CodeBlockTab value="my-breadcrumb.tsx">
    ```tsx
    'use client';
    import type { BreadcrumbProps } from 'fumadocs-ui/layouts/<layout>/page/slots/breadcrumb';

    export function Breadcrumb(props: BreadcrumbProps) {
      return <div>Hello World</div>;
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

You can start from the default implementation with Fumadocs CLI:

<CodeBlockTabs defaultValue="Docs Layout">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Notebook Layout">
      Notebook Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Flux Layout">
      Flux Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="Docs Layout">
    ```bash
    npx @fumadocs/cli add slots/docs/page/breadcrumb
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Notebook Layout">
    ```bash
    npx @fumadocs/cli add slots/notebook/page/breadcrumb
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Flux Layout">
    ```bash
    npx @fumadocs/cli add slots/flux/page/breadcrumb
    ```
  </CodeBlockTab>
</CodeBlockTabs>

### Container [#container]

Container controls the article wrapper around breadcrumb, body, and footer.

To replace the page container:

<CodeBlockTabs defaultValue="page.tsx">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="page.tsx">
      page.tsx
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="my-container.tsx">
      my-container.tsx
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="page.tsx">
    ```tsx
    import { DocsPage } from 'fumadocs-ui/layouts/<layout>/page';
    import { Container } from './my-container';

    <DocsPage
      slots={{
        container: Container,
      }}
    />;
    ```
  </CodeBlockTab>

  <CodeBlockTab value="my-container.tsx">
    ```tsx
    'use client';

    export function Container(props: React.ComponentProps<'article'>) {
      return <div />;
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

You can start from the default implementation with Fumadocs CLI:

<CodeBlockTabs defaultValue="Docs Layout">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="Docs Layout">
      Docs Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Notebook Layout">
      Notebook Layout
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="Flux Layout">
      Flux Layout
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="Docs Layout">
    ```bash
    npx @fumadocs/cli add slots/docs/page/container
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Notebook Layout">
    ```bash
    npx @fumadocs/cli add slots/notebook/page/container
    ```
  </CodeBlockTab>

  <CodeBlockTab value="Flux Layout">
    ```bash
    npx @fumadocs/cli add slots/flux/page/container
    ```
  </CodeBlockTab>
</CodeBlockTabs>
