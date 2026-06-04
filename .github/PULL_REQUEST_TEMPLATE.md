## Description

<!-- Briefly describe what this PR changes and why. -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Documentation update
- [ ] Refactor (no functional changes)
- [ ] Chore (build, CI, dependencies)

## Checklist

- [ ] Tests pass (`bun test --cwd packages/cli`)
- [ ] Lint + typecheck clean (`bun run lint && bunx tsc --noEmit --project packages/cli/tsconfig.json`)
- [ ] No `z.infer` — explicit types used
- [ ] Array access guarded — no unchecked index access
- [ ] No comments in source code
- [ ] Formatted with Biome

## Breaking changes

<!-- If this PR introduces breaking changes, describe what breaks and the migration path. -->
