# Fumadocs UI (the default theme of Fumadocs): Steps
URL: /docs/ui/components/steps
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/steps.mdx

Adding steps to your docs
        


<Installation name="steps" />

## Usage [#usage]

Put your steps into the `Steps` container.

```mdx title="content.mdx"
import { Step, Steps } from 'fumadocs-ui/components/steps';

<Steps>
<Step>

### Hello World

</Step>

<Step>

### Hello World

</Step>
</Steps>
```

### Without imports [#without-imports]

You can use the Tailwind CSS utilities without importing it.

```mdx
<div className="fd-steps">
  <div className="fd-step" />
</div>
```

It supports adding step styles to only headings with arbitrary variants.

```mdx
<div className='fd-steps [&_h3]:fd-step'>

### Hello World

</div>
```

<div className="fd-steps [&_h3]:fd-step">
  ### Hello World [#hello-world]

  You no longer need to use the step component anymore.
</div>
