# Fumadocs UI (the default theme of Fumadocs): Files
URL: /docs/ui/components/files
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/files.mdx

Display file structure in your documentation
        


<Installation name="files" />

## Usage [#usage]

Wrap file components in `Files`, you can use it in your MDX content, or as a normal React.js component.

```mdx title="content.mdx"
import { File, Folder, Files } from 'fumadocs-ui/components/files';

<Files>
  <Folder name="app" defaultOpen>
    <File name="layout.tsx" />
    <File name="page.tsx" />
    <File name="global.css" />
  </Folder>
  <Folder name="components">
    <File name="button.tsx" />
    <File name="tabs.tsx" />
    <File name="dialog.tsx" />
  </Folder>
  <File name="package.json" />
</Files>
```

### File [#file]

<TypeTable
  id="type-table-props.ts-FileProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-FileProps&#x22;,
  &#x22;name&#x22;: &#x22;FileProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;name&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;icon&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

### Folder [#folder]

<TypeTable
  id="type-table-props.ts-FolderProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-FolderProps&#x22;,
  &#x22;name&#x22;: &#x22;FolderProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;name&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: true,
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
      &#x22;name&#x22;: &#x22;defaultOpen&#x22;,
      &#x22;description&#x22;: &#x22;Open folder by default&#x22;,
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

## Remark Plugin [#remark-plugin]

You can enable [`remark-mdx-files`](/docs/headless/mdx/remark-mdx-files) for additional feature & syntax.

```tsx title="source.config.ts (Fumadocs MDX)"
import { remarkMdxFiles } from 'fumadocs-core/mdx-plugins/remark-mdx-files';
import { defineConfig } from 'fumadocs-mdx/config';

export default defineConfig({
  mdxOptions: {
    // [!code ++]
    remarkPlugins: [remarkMdxFiles],
  },
});
```

### CodeBlock Syntax [#codeblock-syntax]

It will convert `files` codeblocks into `<Files />` component, like:

````md title="content.md"
```files
project
├── src
│   ├── index.js
│   └── utils
│       └── helper.js
├── package.json
```
````

### `<auto-files>` [#auto-files]

Generate `<Files />` component from glob.

```mdx title="content.mdx"
<auto-files dir="./my-dir" pattern="**/*.{ts,tsx}" />

<auto-files dir="./my-dir" pattern="**/*.{ts,tsx}" defaultOpenAll />
```
