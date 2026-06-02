# Fumadocs UI (the default theme of Fumadocs): Accordion
URL: /docs/ui/components/accordion
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/accordion.mdx

Add Accordions to your documentation

<Installation name="accordion" />

## Usage [#usage]

Based on
[Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion), useful for FAQ sections.

> For `@fumadocs/base-ui`, this is based on [Base UI](https://base-ui.com/react/components/accordion) instead.

Use it in MDX files or as a normal React component.

<CodeBlockTabs defaultValue="MDX">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="MDX">
      MDX
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="React.js">
      React.js
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="MDX">
    ```mdx
    ---
    title: Hello World
    ---

    import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';

    <Accordions type="single">
      <Accordion title="My Title">My Content</Accordion>
    </Accordions>
    ```
  </CodeBlockTab>

  <CodeBlockTab value="React.js">
    ```tsx
    import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';

    export default function Page() {
      return (
        <Accordions type="single">
          <Accordion title="My Title">My Content</Accordion>
        </Accordions>
      );
    }
    ```
  </CodeBlockTab>
</CodeBlockTabs>

### Accordions [#accordions]

<TypeTable
  id="type-table-props.ts-AccordionsProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-AccordionsProps&#x22;,
  &#x22;name&#x22;: &#x22;AccordionsProps&#x22;,
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
      &#x22;name&#x22;: &#x22;type&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;\&#x22;single\&#x22; | \&#x22;multiple\&#x22;&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: true,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;disabled&#x22;,
      &#x22;description&#x22;: &#x22;Whether or not an accordion is disabled from user interaction.&#x22;,
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
      &#x22;name&#x22;: &#x22;orientation&#x22;,
      &#x22;description&#x22;: &#x22;The layout in which the Accordion operates.&#x22;,
      &#x22;tags&#x22;: [
        {
          &#x22;name&#x22;: &#x22;default&#x22;,
          &#x22;text&#x22;: &#x22;vertical&#x22;
        }
      ],
      &#x22;type&#x22;: &#x22;\&#x22;horizontal\&#x22; | \&#x22;vertical\&#x22; | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;union&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    }
  ]
}"
/>

### Accordion [#accordion]

<TypeTable
  id="type-table-props.ts-AccordionProps"
  type="{
  &#x22;id&#x22;: &#x22;props.ts-AccordionProps&#x22;,
  &#x22;name&#x22;: &#x22;AccordionProps&#x22;,
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
      &#x22;name&#x22;: &#x22;value&#x22;,
      &#x22;description&#x22;: &#x22;&#x22;,
      &#x22;tags&#x22;: [],
      &#x22;type&#x22;: &#x22;string | undefined&#x22;,
      &#x22;simplifiedType&#x22;: &#x22;string&#x22;,
      &#x22;required&#x22;: false,
      &#x22;deprecated&#x22;: false
    },
    {
      &#x22;name&#x22;: &#x22;disabled&#x22;,
      &#x22;description&#x22;: &#x22;Whether or not an accordion item is disabled from user interaction.&#x22;,
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

### Linking to Accordion [#linking-to-accordion]

You can specify an `id` for accordion. The accordion will automatically open when the user is navigating to the page with the specified `id` in hash parameter.

```mdx
<Accordions>
<Accordion title="My Title" id="my-title">

My Content

</Accordion>
</Accordions>
```

> The value of accordion is same as title by default. When an id presents, it will be used as the value instead.
