# regtrace docs

Documentation site for [regtrace](https://github.com/decimozs/regtrace) built with Next.js and Fumadocs.

## Development

```bash
bun run --cwd apps/docs dev       # dev server at http://localhost:3000
bun run --cwd apps/docs build     # production build
bun run --cwd apps/docs start     # serve production build
bun run docs:typecheck            # typecheck docs source
```

All commands are also available from the repo root via `bun run docs:*`.

## What's here

| Path | Content |
|---|---|
| `content/docs/` | All documentation pages (MDX) |
| `content/docs/reference/` | CLI, config, golden set references |
| `content/docs/explanation/` | Architecture, how it works |
| `content/docs/how-to/` | CI integration guides |
| `content/docs/troubleshooting/` | Common issues and fixes |
| `lib/` | Fumadocs content source config |
| `app/` | Next.js pages and layouts |

Stat: 99 pages, 0 build errors.
