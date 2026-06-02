---
name: sync-docs
description: Sync apps/docs/ content with code changes. Map source diffs to affected docs, update/create/remove files, keep meta.json in sync. Use when user finishes a code change and says "sync docs", "update docs", or asks to commit after code changes.
---

# Sync Docs

## Workflow

1. **Detect changes** — `git diff --name-only HEAD` to list changed source files
2. **Map to docs** — use [REFERENCE.md](REFERENCE.md) mapping to find affected docs
3. **Classify each doc** — needs update, creation, or removal
4. **Update meta.json** if adding/removing pages
5. **Build docs** (`bun run docs:build`) to verify

## Doc classification rules

| Source change | Action |
|---|---|
| Source interface/config/schema changed | Update corresponding reference doc |
| Source behavior/algorithm changed | Update corresponding explanation doc |
| New command/flag added | Add to `reference/cli.mdx` |
| New feature/flow | Create new doc (how-to or explanation) |
| Source file removed | Remove corresponding doc + meta.json entry |
| Test-only change | No doc change needed |
| Internal utility change | No doc change needed |

## Using documentation-writer skill

When creating a new doc or rewriting a significant section, load `documentation-writer` skill first. Feed it:

- The source code change (diff)
- The existing doc (if any)
- The doc type (tutorial / how-to / reference / explanation)

Do NOT use documentation-writer for:
- Removing docs
- Small wording tweaks
- Updating version numbers or URLs

## File cleanup

When removing a doc page:
```
git rm apps/docs/content/docs/path/to/page.mdx
```

Then remove its entry from `apps/docs/content/docs/meta.json`.

## meta.json ordering

```
"---Tutorials---",
"tutorials/getting-started",
"tutorials/create-golden-set",
"tutorials/setup-regression",
"tutorials/watch-mode",
"---How-to Guides---",
"how-to/ci-integration",
"how-to/configure-metrics",
"how-to/pin-baseline",
"how-to/debug-failures",
"how-to/generate-reports",
"how-to/switch-provider",
"how-to/rag-evaluation",
"---Reference---",
"reference/cli",
"reference/config-file",
"reference/golden-set",
"reference/run-record",
"reference/metrics",
"reference/judge-providers",
"---Explanation---",
"explanation/why-regtrace",
"explanation/how-regtrace-works",
"explanation/four-pillars",
"explanation/architecture-decisions",
"explanation/quality-gates",
"explanation/regression",
"explanation/deterministic-vs-llm",
"explanation/glossary"
```

## Verification

```bash
bun run docs:build
```

Must exit 0 before committing. Check for 404s in the output — new pages should appear in the route list.
