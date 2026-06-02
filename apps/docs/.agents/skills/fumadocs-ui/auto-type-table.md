# Fumadocs UI (the default theme of Fumadocs): Auto Type Table
URL: /docs/ui/components/auto-type-table
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/auto-type-table.mdx

Auto-generated type table
        


<Wrapper>
    <TypeTable
      id="type-table-temp.ts-AutoTypeTableExample"
      type="{
    &#x22;id&#x22;: &#x22;temp.ts-AutoTypeTableExample&#x22;,
    &#x22;name&#x22;: &#x22;AutoTypeTableExample&#x22;,
    &#x22;description&#x22;: &#x22;&#x22;,
    &#x22;entries&#x22;: [
      {
        &#x22;name&#x22;: &#x22;name&#x22;,
        &#x22;description&#x22;: &#x22;Markdown syntax like links, `code` are supported.\nSee https://fumadocs.dev/docs/ui/components/type-table&#x22;,
        &#x22;tags&#x22;: [],
        &#x22;type&#x22;: &#x22;boolean | null&#x22;,
        &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
        &#x22;required&#x22;: true,
        &#x22;deprecated&#x22;: false
      },
      {
        &#x22;name&#x22;: &#x22;fn&#x22;,
        &#x22;description&#x22;: &#x22;&#x22;,
        &#x22;tags&#x22;: [
          {
            &#x22;name&#x22;: &#x22;param&#x22;,
            &#x22;text&#x22;: &#x22;name - user name.&#x22;
          },
          {
            &#x22;name&#x22;: &#x22;param&#x22;,
            &#x22;text&#x22;: &#x22;allowNull - is null value allowed.&#x22;
          },
          {
            &#x22;name&#x22;: &#x22;returns&#x22;,
            &#x22;text&#x22;: &#x22;user ID&#x22;
          }
        ],
        &#x22;type&#x22;: &#x22;(name: string, allowNull?: boolean) => string&#x22;,
        &#x22;simplifiedType&#x22;: &#x22;function&#x22;,
        &#x22;required&#x22;: true,
        &#x22;deprecated&#x22;: false
      },
      {
        &#x22;name&#x22;: &#x22;options&#x22;,
        &#x22;description&#x22;: &#x22;We love Shiki.\n\n```ts\nconsole.log(\&#x22;Hello World, powered by Shiki\&#x22;);\n```&#x22;,
        &#x22;tags&#x22;: [
          {
            &#x22;name&#x22;: &#x22;default&#x22;,
            &#x22;text&#x22;: &#x22;{ a: \&#x22;test\&#x22; }&#x22;
          }
        ],
        &#x22;type&#x22;: &#x22;Partial<{ a: unknown; }> | undefined&#x22;,
        &#x22;simplifiedType&#x22;: &#x22;Partial<object>&#x22;,
        &#x22;required&#x22;: false,
        &#x22;deprecated&#x22;: false
      }
    ]
  }"
      id="example"
    />
</Wrapper>

<Callout title="Server Component only" type="warn">
  You cannot use this in a client component, instead, try the [build-time MDX integration](/docs/integrations/typescript#mdx-integration) instead.
</Callout>

It generates a table for your docs based on TypeScript definitions.

## Usage [#usage]

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
    npm i fumadocs-typescript
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm add fumadocs-typescript
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn add fumadocs-typescript
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun add fumadocs-typescript
    ```
  </CodeBlockTab>
</CodeBlockTabs>

Initialize the TypeScript compiler and add it as a MDX component.

```tsx title="components/mdx.tsx"
import defaultComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { createGenerator, createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { AutoTypeTable, type AutoTypeTableProps } from 'fumadocs-typescript/ui';

const generator = createGenerator({
  // set a cache, necessary for serverless platform like Vercel
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
});

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    // [!code ++]
    AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
    ...components,
  } satisfies MDXComponents;
}
```

You can now reference `<AutoTypeTable />` in your MDX content.

See [TypeScript DocGen](/docs/integrations/typescript) for more usages.

### From File [#from-file]

It accepts a `path` prop that points to a typescript file, and `name` for the exported type name.

```ts title="path/to/file.ts"
export interface MyInterface {
  name: string;
}
```

```mdx title="content.mdx"
<AutoTypeTable path="./path/to/file.ts" name="MyInterface" />
```

The path is relative to your project directory (`cwd`), because `AutoTypeTable` is a React Server Component, it cannot access build-time information like MDX file path.

### From Type [#from-type]

You can specify the type to generate, without an actual TypeScript file.

```mdx title="content.mdx"
<AutoTypeTable type="{ hello: string }" />
```

When a `path` is given, it shares the same context as the TypeScript file.

```ts title="file.ts"
export type A = { hello: string };
```

```mdx title="content.mdx"
<AutoTypeTable path="file.ts" type="A & { world: string }" />
```

When `type` has multiple lines, the export statement and `name` prop are required.

```mdx title="content.mdx"
<AutoTypeTable
  path="file.ts"
  name="B"
  type={`
import { ReactNode } from "react"
export type B = ReactNode | { world: string }
`}
/>
```

### Functions [#functions]

Notice that only object type is allowed. For functions, you should wrap them into an object instead.

```ts
export interface MyInterface {
  myFn: (input: string) => void;
}
```

## TypeScript Compiler [#typescript-compiler]

Under the hood, it uses the [Typescript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) to extract type information.
Your `tsconfig.json` file in the current working directory will be loaded.

You can change the compiler settings from [`createGenerator()`](/docs/integrations/typescript).

```ts
import { createGenerator, createFileSystemGeneratorCache } from 'fumadocs-typescript';

const generator = createGenerator({
  tsconfigPath: './tsconfig.json',
  // where to resolve relative paths (normally cwd)
  basePath: './',
  // other options...
});
```

### File System [#file-system]

It relies on the file system, hence, the page referencing this component must be built in **build time**. Rendering the component on serverless runtime may cause problems.

## References [#references]

<TypeTable
  id="type-table-props.ts-AutoTypeTableProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-AutoTypeTableProps&#x22;,
  &#x22;name&#x22;: &#x22;AutoTypeTableProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;path&#x22;,
      &#x22;description&#x22;: &#x22;The path to source TypeScript file.&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;generator&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;{ generateDocumentation(file: { path: string; content?: string; }, name: string | undefined, options?: GenerateOptions): Promise<GeneratedDoc[]>; generateTypeTable(props: BaseTypeTableProps, options?: GenerateTypeTableOptions): Promise<GeneratedDoc[]>; }&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;shiki&#x22;,
      &#x22;description&#x22;: &#x22;Shiki configuration when using default `renderMarkdown` & `renderType`&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;ShikiOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;options&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;GenerateTypeTableOptions | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;object&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;renderMarkdown&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;((md: string) => Promise<React.ReactNode>) | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;function&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;renderType&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;((type: string) => Promise<React.ReactNode>) | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;function&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;name&#x22;,
      &#x22;description&#x22;: &#x22;Exported type name to generate from.&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;type&#x22;,
      &#x22;description&#x22;: &#x22;Set the type to generate from.\n\nWhen used with `name`, it generates the type with `name` as export name.\n\n```ts\nexport const myName = MyType;\n```\n\nWhen `type` contains multiple lines, `export const` is not added.\nYou need to export it manually, and specify the type name with `name`.\n\n```tsx\n<AutoTypeTable\n  path=\&#x22;./file.ts\&#x22;\n  type={`import { ReactNode } from \&#x22;react\&#x22;\n  export const MyName = ReactNode`}\n  name=\&#x22;MyName\&#x22;\n/>\n```&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>
