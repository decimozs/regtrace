# Agent Skills & Context Instructions

This directory contains specialized system prompts, schema constraints, and behavioral guidelines tailored for **AI Agents and LLMs** interacting with this codebase. 

---

### Developer Note
> **These are not end-user product documentations.** > Do not modify these files unless you are altering the core architectural constraints, coding standards, or behavioral rules that autonomous agents must adhere to when generating code or executing tasks in this repo.

---

## What’s in here?

These markdown files act as a "deterministic sandbox" for LLM context injection. They enforce our engineering philosophy, preventing model drift and ensuring code consistency:

* **`project-overview.md`** – High-level system architecture and domain boundaries.
* **`architecture-decisions.md`** – Core ADRs, system invariants, and scalability boundaries.
* **`coding-conventions.md`** – Our strict development stack rules, patterns, and lint expectations.
* **`cli-ux-principles.md`** – UX paradigms for command-line tool generation.
* **`testing-strategy.md`** – Testing paradigms and coverage expectations.
* **`metric-contract.md`** & **`golden-set-schema.md`** – Telemetry, evaluation datasets, and strict validation schemas for agent verification.

