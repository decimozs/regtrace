# Fumadocs UI (the default theme of Fumadocs): GitHub Info
URL: /docs/ui/components/github-info
Source: https://raw.githubusercontent.com/fuma-nama/fumadocs/refs/heads/main/apps/docs/content/docs/ui/components/github-info.mdx

Display your GitHub repository information
        


<Installation name="github-info" />

## Usage [#usage]

```tsx
import { GithubInfo } from 'fumadocs-ui/components/github-info';

export function MyComp() {
  return (
    <GithubInfo
      owner="fuma-nama"
      repo="fumadocs"
      // your own GitHub access token (optional)
      token={process.env.GITHUB_TOKEN}
    />
  );
}
```

It's recommended to add it to your docs layout with `links` option:

```tsx title="app/docs/layout.tsx"
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { GithubInfo } from 'fumadocs-ui/components/github-info';

function docsOptions(): DocsLayoutProps {
  return {
    ...baseOptions(),
    tree: source.getPageTree(),
    links: [
      {
        type: 'custom',
        children: <GithubInfo owner="fuma-nama" repo="fumadocs" />,
      },
    ],
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout {...docsOptions()}>{children}</DocsLayout>;
}
```
