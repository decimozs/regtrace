# Regtrace — Architecture Decisions

This file documents the deliberate structural decisions made in Regtrace's design and the reasoning behind each one. Before suggesting architectural changes or adding new features, understand why these decisions were made.

## Decision 1 — The Judge Layer Is Isolated From Metrics

**Decision:** Metrics never import LLM provider SDKs directly. All LLM judge calls go through `src/judge/index.ts` which exposes a single provider-agnostic interface.

**Why:** Provider isolation means swapping from OpenAI to Anthropic requires changing one config line, not touching metric code. It also means the judge can be mocked in a single place during testing, making all LLM-judged metric tests fast and free. Any code that bypasses this layer and calls a provider SDK directly from a metric file is a violation of this architecture.

---

## Decision 2 — The CLI Layer Never Imports From Metrics Directly

**Decision:** The dependency flow is strictly `cli → core → metrics → judge`. CLI command files only import from `src/core/`. They never import from `src/metrics/` or `src/judge/` directly.

**Why:** Commands should be thin. Their job is to parse flags, call the core runner, and hand results to the output renderer. If a command contains evaluation logic it becomes untestable without spinning up the full evaluation engine. Keeping commands thin means you can test command behavior by mocking the core layer, not by running real evaluations.

---

## Decision 3 — The Storage Layer Is the Only Code That Touches the File System

**Decision:** All file system reads and writes go through `src/storage/`. No other module imports `node:fs`, `Bun.file`, or any file system API directly.

**Why:** This makes testing dramatically easier. Unit tests mock the storage layer once and no test ever writes to disk or reads from a real file path. It also means file system behavior — path resolution, error handling, cross-platform differences — is handled in one place rather than scattered across the codebase.

---

## Decision 4 — The Run Record Is the Single Source of Truth

**Decision:** After a run completes, all results are written to a run record in `.regtrace/runs/`. Every inspection command — `compare`, `audit`, `report`, `history` — reads from stored run records. They never re-run evaluations or reconstruct results from other sources.

**Why:** This ensures that what you see in `regtrace report` is exactly what happened during `regtrace run`, not a reconstruction. It also means the dashboard in v2 reads the same data structure that the CLI already produces. The run record format is the API contract between the evaluation engine and everything that consumes results.

---

## Decision 5 — Regression Is Always On, Never Opt-In

**Decision:** Regression scoring runs automatically on every `regtrace run` execution. There is no flag to disable it during normal operation. It can only be disabled in the config file for projects explicitly in early development with no stable baseline.

**Why:** Regression being opt-in defeats its purpose. If developers have to remember to ask for regression detection, they will forget to ask exactly when it matters most — after a rushed model update or a last-minute prompt change. Making it automatic means it protects teams even when they are not thinking about it.

---

## Decision 6 — Deterministic and LLM-Judged Metrics Are Explicitly Separated

**Decision:** Every metric declares its `evaluationType` as either `deterministic` or `llm_judged` as part of the metric contract. The runner uses this to display cost estimates before execution and to run deterministic metrics first.

**Why:** Users need to know what they are paying for before they pay for it. A format check that fails deterministically should not trigger LLM judge calls. Running deterministic metrics first means the cheapest failures are caught immediately, and expensive LLM calls only happen when the fast checks pass. This separation also builds user trust — deterministic scores are always confidence 1.0 and users should understand why.

---

## Decision 7 — Golden Sets Are YAML, Model-Agnostic, and Flat

**Decision:** Golden sets are YAML files. They contain no model name or model version. Test cases are a flat list — no nesting, no groups within groups.

**Why YAML:** Human-readable, Git-diffable, and writable by non-developers without tooling. JSON is harder to read and edit manually. TOML lacks the list structure needed for test cases.

**Why model-agnostic:** Which model produced the actual output is tracked at the run level not the test case level. Test cases represent quality contracts that should hold regardless of which model is being evaluated. Baking model names into test cases would make golden sets model-specific and defeat the purpose of regression testing across model changes.

**Why flat:** Flat lists filtered by tags are simpler to reason about than hierarchies. Tags provide all the organizational power of nesting without the complexity of tree traversal, recursive validation, or ambiguous inheritance of thresholds.

---

## Decision 8 — Config File Is Declarative Only

**Decision:** `regtrace.config.yaml` is purely declarative. No conditional logic, no scripting, no dynamic values. It declares what golden sets exist, how metrics behave, which judge to use, and what quality gates to enforce.

**Why:** A declarative config is predictable, diffable, and explainable. Two developers reading the same config file should reach identical conclusions about what a run will do. If the config contained logic or conditionals that behavior would depend on runtime context in ways that are hard to audit. Predictability is more valuable than flexibility at the config level.

---

## Decision 9 — Three-Level Override System

**Decision:** Every evaluation setting has three levels of precedence: config file sets the default, CLI flag overrides for a single run, test case field overrides for a single test case.

**Why:** This gives users flexibility at every zoom level without making any single level too complex. A QA engineer running a focused audit can override thresholds at the CLI level without editing the config. A test case that represents a known ambiguous scenario can lower its own threshold without affecting the rest of the suite. The config remains the authoritative default for the whole project.

---

## Decision 10 — Judge Prompts Are Typed Functions, Not Raw Strings

**Decision:** All LLM judge prompts live in `src/judge/prompts/` as TypeScript functions that take typed inputs and return typed prompt strings. Prompts are never written as raw template literals inside metric files.

**Why:** Prompts are code. They need to be versioned, testable, and refactorable like any other code. A prompt written inline in a metric file is invisible to code review, impossible to test in isolation, and easy to accidentally break when the surrounding code changes. Treating prompts as typed functions means they get the same engineering discipline as everything else.
