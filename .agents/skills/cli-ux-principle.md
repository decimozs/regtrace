# Regtrace — CLI UX Principles

The CLI is the product. Every interaction a developer has with Regtrace happens through it. These principles govern every command's behavior, output, and feel. A command that violates these principles ships a broken user experience even if the underlying evaluation logic is correct.

## The Three-Layer Mental Model

Every Regtrace command belongs to one of three layers. Knowing which layer a command belongs to determines its design constraints:

**Setup layer** — commands that initialize and manage the project and golden sets. `init`, `set add`, `set list`, `set diff`. These are run infrequently. They can be interactive, ask questions, and be verbose with confirmation messages.

**Execution layer** — commands that run evaluations and produce results. `run`, `score`. These are run frequently, often in scripts and pipelines. They must be fast, non-interactive by default, and CI-compatible.

**Inspection layer** — commands that let developers understand and audit results. `compare`, `audit`, `report`, `history`. These are debugging tools. They should surface detail efficiently without overwhelming.

## Exit Code Contract

Every command that produces a pass/fail result must follow this contract exactly. Pipeline tools read exit codes, not terminal output.

| Code | Meaning |
|------|---------|
| `0` | All quality gates passed |
| `1` | One or more quality gates failed |
| `2` | Configuration or schema error — evaluation did not run |
| `3` | Judge provider error — evaluation could not complete |

Never use any other exit code. Never exit with code 1 for a config error — that conflates evaluation failure with infrastructure failure and breaks pipeline logic.

## stdout vs stderr

**JSON output always goes to stdout.** When `--format json` is passed, the entire JSON result is written to stdout and nothing else. Not a loading message, not a summary, not a newline — just the JSON object. This makes piping work correctly: `regtrace run --format json | jq '.suiteScore'`.

**All other output goes to stderr.** Progress indicators, status messages, warnings, error messages, and human-readable summaries all go to stderr. This keeps stdout clean for machine consumption even when `--format json` is not passed.

**Never mix JSON and human-readable text on stdout.** A single non-JSON character on stdout before or after the JSON object breaks every downstream parser.

## CI Mode

When `--ci` flag is passed or when `CI=true` is detected in the environment:

- No color, no bold, no ANSI escape codes of any kind
- No spinner animations or progress indicators
- No interactive prompts — if a prompt would appear, fail with a clear error message instead
- No clearing or overwriting previous lines
- Plain text output only

CI mode auto-detection checks for `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, and `CIRCLECI` environment variables. When any of these are set, CI mode activates automatically unless explicitly overridden with `--no-ci`.

## Terminal Output Philosophy

**The summary fits on one screen.** After `regtrace run` completes, the developer should see everything they need to know about the run without scrolling. The suite score, per-metric breakdown, regression status, and count of failures all fit in one terminal window. Detail lives in `audit` and `report`, not in the default run output.

**Failed test cases are always shown in the default run output.** When test cases fail, their ID, description, failed metrics, scores, and explanations appear after the summary. The developer should never have to run a second command to find out why their run failed — unless they want deeper detail.

**Passing test cases are not listed by default.** A run with 50 passing test cases and 2 failing ones should show 2 test cases, not 52. Verbose mode `--verbose` lists all test cases.

## Color Usage

Color is a signal, not decoration. Use it consistently and meaningfully:

- **Green** — passed, scores above threshold, improvements from baseline
- **Yellow** — warnings, low confidence scores, near-threshold scores, golden set version changes detected
- **Red** — failures, regressions, errors, critical threshold violations
- **Neutral/default** — metadata, labels, non-scored information

Never use color for purely aesthetic reasons. A developer reading Regtrace output in a dark terminal, a light terminal, or a color-blind mode should always be able to understand the output from structure alone, not color alone.

## Command Design Rules

**Commands are thin.** A command file's job is: parse flags, validate inputs, call into `core/`, hand results to `output/`. No evaluation logic, no business logic, no direct file access belongs in a command file. If a command file is growing large, the logic belongs in `core/`, not the command.

**Every flag has a long form.** `--format` not just `-f`. Long forms are self-documenting in scripts and CI configs. Short forms are optional aliases for interactive use.

**Destructive operations ask for confirmation interactively.** In non-CI mode, any operation that deletes data — like clearing run history — asks for explicit confirmation. In CI mode it requires an explicit `--yes` flag instead of prompting.

**Help text is part of the feature.** Every command and every flag has a help string. `regtrace run --help` should be enough for a developer to use the command correctly without reading external documentation. Help text uses present tense, active voice, and concrete language — not marketing copy.

## Progress Rendering

For `regtrace run`, show a live progress indicator while evaluations are in flight. Developers need to know the tool is running, not hanging, especially for large golden sets where LLM judge calls introduce latency.

The progress display shows:
- Test cases completed vs total
- Current metric being evaluated
- Running pass rate
- Estimated time remaining based on current pace

Progress rendering uses Ink for smooth in-place updates. In CI mode progress rendering is disabled entirely — only the final summary is printed.

## Error Messages

**Error messages tell the developer what to do, not just what went wrong.** Instead of `Error: missing field 'expected_output' in test case`, say `Error: test case 'cs-001' in golden set 'customer-support.yaml' is missing required field 'expected_output'. Add this field with the human-labeled ideal response for this test case.`

**Config and schema errors show the file path and line context.** A developer should never have to search for which file contains the error.

**Judge provider errors distinguish between auth failures, rate limits, and network errors.** Each maps to a different fix and a different level of urgency.

## The `--dry-run` Principle

`regtrace run --dry-run` validates everything — config, golden sets, schema, environment variables, judge provider connectivity — without executing any evaluations or spending tokens. This should complete in under two seconds.

Every new validation step added to the run pipeline must also be reachable via `--dry-run`. Developers should be able to verify their setup is correct before committing to a full run.
