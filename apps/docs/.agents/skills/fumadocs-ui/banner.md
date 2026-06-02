# Fumadocs UI (the default theme of Fumadocs): Banner
URL: /docs/ui/components/banner
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/banner.mdx

Add a banner to your site
        


<Installation name="banner" />

## Usage [#usage]

Put the element at the top of your root layout, you can use it for displaying announcements.

```tsx
import { Banner } from 'fumadocs-ui/components/banner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* [!code ++] */}
        <Banner>Hello World</Banner>
        {children}
      </body>
    </html>
  );
}
```

### Variant [#variant]

Change the default variant.

```tsx
import { Banner } from 'fumadocs-ui/components/banner';

<Banner variant="rainbow">Hello World</Banner>;

// customize colors
<Banner
  variant="rainbow"
  rainbowColors={[
    'rgba(255,100,0, 0.5)',
    'rgba(255,100,0, 0.5)',
    'transparent',
    'rgba(255,100,0, 0.5)',
    'transparent',
    'rgba(255,100,0, 0.5)',
    'transparent',
  ]}
>
  Hello World
</Banner>;
```

### Change Layout [#change-layout]

By default, the banner uses a `style` tag to modify Fumadocs layouts (e.g. reduce the sidebar height).
You can disable it with:

```tsx
import { Banner } from 'fumadocs-ui/components/banner';

<Banner changeLayout={false}>Hello World</Banner>;
```

### Close [#close]

To allow users to close the banner, give the banner an ID.

```tsx
import { Banner } from 'fumadocs-ui/components/banner';

<Banner id="hello-world">Hello World</Banner>;
```

The state will be automatically persisted.
