# Regtrace — Project Overview

## What Regtrace Is

Regtrace is an automated evaluation framework for LLM outputs. It scores model responses across four dimensions — Factuality, Format, Tone, and Regression — using human-labeled golden sets as the ground truth contract. It is a CLI-first tool designed to work in any project regardless of programming language or tech stack.

## The Core Problem Regtrace Solves

Most teams building LLM products do not know when their model gets worse. They ship a prompt change, swap a model version, or tweak a RAG pipeline and have no systematic way to detect quality degradation. They rely on manual spot-checking or user complaints. Regtrace fills that gap by giving teams a repeatable, automated quality contract they can run in development and enforce in CI/CD.

## The Mental Model — A Linter for LLM Outputs

**Regtrace is a linter for LLM outputs.** This is the single most important mental model for every design and implementation decision.

Just like ESLint tells you exactly which rule you broke and where, Regtrace tells you:
- Which dimension failed — Factuality, Format, Tone, or Regression
- Why it failed — plain English explanation from the judge
- How confident the evaluator is in that judgment
- How the score compares to the last baseline

Every feature, every command, every output format should be evaluated against this mental model. If it does not make Regtrace a better linter for LLM outputs, it does not belong in the MVP.

## The Four Pillars

**Factuality** — measures whether the claims in the actual output are accurate and faithful to the expected output and retrieved context. For RAG interactions this means faithfulness to the retrieved context specifically. A factuality failure means the model is making wrong or unsupported claims.

**Format** — measures whether the actual output conforms to the expected structural and formatting requirements. This is the only predominantly deterministic pillar — it is fast, cheap, and does not require an LLM judge. A format failure means the output does not match the required structure.

**Tone** — measures whether the actual output matches the expected voice, style, and emotional register. It evaluates formality, sentiment alignment, assertiveness, persona consistency, and verbosity. A tone failure means the output has the wrong register or persona for the context.

**Regression** — measures relative change in scores over time against a previously established baseline. It is not an absolute quality measure — it is a change detection system. A regression failure means quality is trending down from the last passing baseline.

## What Makes Regtrace Different From DeepEval

- **Regression is a first-class citizen** not an afterthought. Every run automatically produces a regression report against the last passing baseline without any opt-in required.
- **Intentionally scoped to four pillars** that go deep rather than twenty metrics that stay shallow. This gives teams a clearer mental model of why a response failed.
- **Human-label-first philosophy.** Golden sets are required, not optional. They are the contract.
- **CLI-native and complete.** The CLI is a full tool, not a wrapper around a platform. The dashboard, when it comes, is a viewer not a dependency.
- **Explainable by default.** Every score comes with a plain English explanation always, not hidden behind a flag.
- **Designed for CI/CD from the start.** Proper exit codes, machine-readable output, and a quality gate concept that maps directly to a pipeline step.

## Primary Users

- Solo developers and indie hackers building LLM-powered products
- ML and AI engineers on a team shipping model updates frequently
- QA engineers testing LLM application quality systematically

All three user types should be able to install Regtrace, initialize a project, and run their first evaluation in under ten minutes.

## Supported Interaction Types

**MVP scope:**
- Single-turn — one input, one output, one expected output
- RAG-based — input plus retrieved context documents, evaluated for faithfulness

**Deferred to v2:**
- Multi-turn conversations
- Agent and tool-call outputs

## What Regtrace Explicitly Is Not

- Not a prompt template manager — prompt construction belongs to the application
- Not a platform — the CLI is the product, the dashboard is a future viewer
- Not a library to import into application code — it is a standalone tool
- Not an LLM testing framework for unit testing code that calls LLMs — it evaluates output quality, not code correctness
- Not opinionated about which model you use — it is model-agnostic by design

## Distribution Goal

Any developer on any project in any programming language should be able to install Regtrace and run it without installing a language runtime they do not already have. The binary distribution story is as important as the feature set.
