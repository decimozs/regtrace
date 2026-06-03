# Product

## Register

brand

## Users

Solo developers and indie hackers building LLM-powered products. ML and AI
engineers shipping model updates frequently. QA engineers testing LLM
application quality systematically. They work in terminals, use CLI tools,
and value deterministic results over marketing claims. The landing page
needs to communicate value fast — their time is scarce.

## Product Purpose

Regtrace is an automated evaluation framework for LLM outputs. It scores
model responses across four dimensions — Factuality, Format, Tone, and
Regression — using human-labeled golden sets as the ground truth contract.
It is a CLI-first tool designed to work in any project regardless of
programming language or tech stack.

The core mental model is **a linter for LLM outputs.** Just like ESLint
tells you exactly which rule you broke and where, Regtrace tells you which
dimension failed, why it failed, how confident the evaluator is, and how
the score compares to the last baseline.

Success looks like: a developer installs Regtrace, initializes a project,
and runs their first evaluation in under ten minutes without referring to
external documentation.

## Brand Personality

Precise, confident, sharp. The brand communicates the same qualities it
evaluates in LLM outputs: accuracy, structure, appropriate tone, and
regression awareness. No hype, no buzzwords. Every element earns its place.

## Anti-references

- **SaaS dashboard / enterprise software.** No heavy admin panels, no
  feature-compare tables, no pricing tiers, no "schedule a demo" CTAs.
- **AI chatbot UIs.** No conversational interfaces, no "ask me anything"
  inputs, no chat bubbles.
- **Generic startup landing pages.** No hero-metric templates (big number +
  small label + gradient accent), no testimonial carousels, no identical
  card grids with icon + heading + text repeated endlessly.

## Design Principles

1. **Show, don't tell.** The landing page should demonstrate the CLI
   experience — terminal output, real evaluation results, actual commands.
   Developers judge tools by using them, not by reading about them.

2. **Expert confidence.** Minimal UI, maximum signal. Every section earns
   its scroll. The visual language is restrained: one accent color, one
   font family (Geist), generous whitespace. Nothing decorative.

3. **CLI-native aesthetic.** The tool is a terminal application. The page
   references this through mock terminal windows, code blocks, monospace
   text, and a dark theme that feels like a developer's IDE rather than a
   marketing site.

4. **Four pillars as the organizing idea.** The factuality / format / tone /
   regression framework is the product's mental model. The landing page
   echoes this structure and makes it intuitive at a glance.

## Accessibility & Inclusion

- WCAG 2.1 Level AA minimum (4.5:1 body text contrast).
- Dark theme is primary (developers work in dark mode). Light theme is a
  secondary option that maintains contrast parity.
- All animations respect `prefers-reduced-motion`. Content is never gated
  behind a motion trigger.
- Terminal output in mockups uses real text, not images — readable by
  screen readers.
