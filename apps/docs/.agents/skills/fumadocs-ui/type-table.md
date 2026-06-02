# Fumadocs UI (the default theme of Fumadocs): Type Table
URL: /docs/ui/components/type-table
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/type-table.mdx

A table for documenting types
        


<Installation name="type-table" />

## Usage [#usage]

It accepts a `type` property.

```mdx
import { TypeTable } from 'fumadocs-ui/components/type-table';

<TypeTable
  type={{
    percentage: {
      description: 'The percentage of scroll position to display the roll button',
      type: 'number',
      default: 0.2,
    },
  }}
/>
```

## References [#references]

### Type Table [#type-table]

<TypeTable
  id="type-table-props.ts-TypeTableProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-TypeTableProps&#x22;,
  &#x22;name&#x22;: &#x22;TypeTableProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;type&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;Record<string, TypeNode>&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;Record<string, object>&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

### Object Type [#object-type]

<TypeTable
  id="type-table-props.ts-ObjectTypeProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-ObjectTypeProps&#x22;,
  &#x22;name&#x22;: &#x22;ObjectTypeProps&#x22;,
  &#x22;description&#x22;: &#x22;&#x22;,
  &#x22;entries&#x22;: [
    {
      &#x22;name&#x22;: &#x22;description&#x22;,
      &#x22;description&#x22;: &#x22;Additional description of the field&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;type&#x22;,
      &#x22;description&#x22;: &#x22;type signature (short)&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;typeDescription&#x22;,
      &#x22;description&#x22;: &#x22;type signature (full)&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;typeDescriptionLink&#x22;,
      &#x22;description&#x22;: &#x22;Optional `href` for the type&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;default&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;React.ReactNode&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;ReactNode&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;required&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;deprecated&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;boolean | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;parameters&#x22;,
      &#x22;description&#x22;: &#x22;a list of parameters info if the type is a function.&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;ParameterNode[] | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;array&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;returns&#x22;,
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
