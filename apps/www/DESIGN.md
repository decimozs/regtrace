---
name: Regtrace
description: A linter for your LLM outputs
colors:
  primary: oklch(0.6 0.2 25)
  neutral-bg: oklch(0.06 0.008 20)
  neutral-surface: oklch(0.1 0.01 20)
  neutral-code: oklch(0.08 0.006 20)
  neutral-ink: oklch(0.98 0.002 20)
  neutral-muted: oklch(0.6 0.015 20)
  neutral-border: oklch(0.18 0.01 20)
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: oklch(1 0 0)
    rounded: "{rounded.full}"
    padding: "0 32px"
    height: "48px"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.full}"
    padding: "0 32px"
    height: "48px"
    border: 1px solid "{colors.neutral-border}"
  card-feature:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    border: 1px solid "{colors.neutral-border}"
    padding: "24px"
  code-block:
    backgroundColor: "{colors.neutral-code}"
    rounded: "{rounded.md}"
    border: 1px solid "{colors.neutral-border}"
    padding: "12px"
  input-email:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.lg}"
    border: 1px solid "{colors.neutral-border}"
    padding: "0 16px"
    height: "48px"
    placeholderTextColor: "{colors.neutral-muted}"
---

# Design System: Regtrace

## 1. Overview

**Creative North Star: "The Linter's Lens"**

Regtrace's visual language treats every pixel through the same lens of precision
that the tool applies to LLM outputs. The page is a command-line interface made
tangible: dark backdrop, monospaced annotations, stark red signal markers, and
terminal mockups that demonstrate the tool instead of describing it. Nothing is
decorative. Every element earns its place through function.

The system explicitly rejects SaaS/enterprise dashboard tropes — no heavy admin
panels, no pricing tiers, no "schedule a demo" buttons. It speaks developer
language because it is a developer tool. The red accent is not expressive; it is
a pass/fail signal, the same red that flags a failing test case in the terminal.

**Key Characteristics:**
- CLI-native aesthetic with terminal mockups and code blocks
- Restrained color: one accent (Stoplight Red) on near-black neutral surfaces
- Single font family (Geist) with weight contrast — no display/body pair
- Blur-enhance motion: content starts readable and resolves into clarity
- dark-first, light-theme-as-secondary-option

## 2. Colors

**The Color Strategy: Restrained.** One saturated accent on a deep neutral
canvas. The palette carries no secondary or tertiary hue. The red is not
decorative — it signals pass/fail, the same role red plays in the terminal.

### Primary
- **Stoplight Red** (oklch(0.6 0.2 25)): Primary accent for CTAs, active
  indicators, severe thresholds, and the Regtrace brand mark. Used sparingly —
  ≤10% of any given screen. Its rarity is its power.

### Neutral
- **Deep Background** (oklch(0.06 0.008 20)): Primary page background. Near-black
  with a fractional tilt toward the red hue family.
- **Surface** (oklch(0.1 0.01 20)): Card and container backgrounds. One step
  lighter than the page for subtle layering.
- **Code Surface** (oklch(0.08 0.006 20)): Terminal mockup and code block
  backgrounds. Darker than cards, lighter than the page.
- **Ink** (oklch(0.98 0.002 20)): Primary text color. Near-white for the dark
  theme.
- **Muted** (oklch(0.6 0.015 20)): Secondary text, code samples, metadata.
  Hits 4.5:1 against the background.
- **Border** (oklch(0.18 0.01 20)): Subtle surface separators. Barely visible,
  provides structure without noise.

### Light mode
The light theme shifts all neutrals up the lightness scale while preserving the
same hue tilt (chroma toward red at hue 20). Ink and background swap roles:
- Background: oklch(0.97 0.008 20)
- Ink: oklch(0.12 0.012 20)
- Surface: oklch(0.99 0.004 20)
- Muted: oklch(0.4 0.015 20)

### Named Rules
**The Stoplight Rule.** Red is a signal, not a decoration. Never use the accent
for decorative purposes (gradient text, glassmorphism, background fills). Red
means pass/fail, alert, measurement threshold. If a red element does not
communicate status, it should not be red.

## 3. Typography

**Display & Body Font:** Geist (with system-ui and sans-serif fallback)
**Label/Mono Font:** Geist Mono (with monospace fallback)

**Character:** A single-family system with broad weight contrast. Geist provides
the entire hierarchy from display hero (700 weight) to monospaced code (400
weight) to small labels (300 weight). No serif, no secondary sans. The
monospace usage is earned — it appears in terminal mockups, code blocks, and
package-manager-style tags.

### Hierarchy
- **Display** (700, clamp(2.5rem, 7vw, 4.5rem), 1.05): Hero section heading
  only. Capped at 4.5rem (72px). Tight tracking at -0.03em. Balanced with
  text-wrap: balance.
- **Headline** (600, clamp(1.5rem, 4vw, 2.25rem), 1.2): Section headings and
  feature card titles. text-wrap: balance.
- **Title** (600, 1rem, 1.4): Card headings, step titles, form labels.
- **Body** (400, 1rem, 1.6): Paragraph text. Max line length 60ch.
- **Label** (400, 0.75rem, 1.4, lowercase): Metadata, code samples, package
  badges, legal text. Set in Geist Mono when used near code.
- **Code** (400, 0.75rem, 1.6): Inline code, terminal output, YAML snippets.
  Set in Geist Mono. Monospace is earned here — the product is a CLI tool.

## 4. Elevation

The system uses tonal layering instead of box shadows. Depth is conveyed
through background lightness differences, not through dropped shadows. The
natural layers are:

- **Page** (Deep Background, oklch(0.06 0.008 20)): The canvas
- **Card** (Surface, oklch(0.1 0.01 20)): One step lighter
- **Code Block** (Code Surface, oklch(0.08 0.006 20)): Between page and card

No shadow vocabulary exists. Cards use a 1px border (neutral-border) for
definition, never a drop shadow. The "layered" feel comes from the lightness of
the surface, not from blur.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are inherently flat. Layering is
communicated by lightness, not by shadow. No box-shadow on cards, panels, or
containers. The exception is the hero CTA button hover, which uses a glow
animation (pulse-glow) — this is a deliberate accent effect, not a shadow.

## 5. Components

### Buttons
- **Shape:** Full-pill (border-radius: 9999px), 48px height.
- **Primary:** Stoplight Red background, white text, 32px horizontal padding.
  Hover: brightness(1.1). Active: scale(0.95).
- **Secondary:** Transparent background, Ink text, 1px solid Border stroke.
  Hover: Surface background. Active: scale(0.95).
- **Both:** No box-shadow. Transition: all 0.15s ease. No focus-ring yet
  (pending WCAG audit for focus-visible).

### Cards / Feature Containers
- **Corner Style:** 12px radius.
- **Background:** Surface (oklch(0.1 0.01 20)), 1px Border stroke.
- **Shadow Strategy:** None — flat by default (see Elevation).
- **Internal Padding:** 24px (spacing.lg).
- **Distinctive Detail:** 4px full-width colored top bar in the pillar accent
  (Stoplight Red, Blue, Emerald, Amber). This is the only colored surface
  decoration; the bar is small and functional, not decorative.

### Inputs / Fields
- **Style:** 1px Border stroke, Surface background, 12px radius, 48px height.
- **Focus:** Border shifts to Stoplight Red with a subtle 1px red ring
  (focus:ring-1 focus:ring-accent/30).
- **Placeholder:** Muted text. No label animation.
- **Error:** Not yet implemented. (Pending harden pass.)

### Code Blocks
- **Background:** Code Surface (oklch(0.08 0.006 20)), 1px Border stroke.
- **Corner Style:** 8px radius.
- **Internal Padding:** 12px.
- **Typography:** Geist Mono, 0.75rem, Muted color.
- **Terminal Top Bar:** Three colored dots (red/yellow/green style) above code
  blocks that represent terminal windows.

### Navigation Dots
- **Position:** Fixed right, vertically centered.
- **Style:** 2-3px circles. Border for inactive, filled Stoplight Red + ring
  for active. Tooltip label appears on hover via CSS opacity transition.

### Pill / Tag Badges
- **Style:** Full-pill (9999px), Border stroke, Surface background, Muted text,
  0.75rem Geist Mono. Used in the footer for "CLI-First", "Built with Bun",
  "MIT License" badges.

## 6. Do's and Don'ts

### Do:
- **Do** use the terminal mockup pattern to demonstrate real regtrace output.
  This is the primary "imagery" of the site — developers evaluate code by
  reading code.
- **Do** apply the Stoplight Rule: red means status, never decoration.
- **Do** use tonal layering for depth. Surface is one step lighter than the
  page, Code Surface is between them. No shadows.
- **Do** show failing test cases and suite scores in mockups. The "linter"
  mental model is the product pitch; demonstrate it.
- **Do** respect prefers-reduced-motion. Content is always readable before
  animation resolves.

### Don't:
- **Don't** use side-stripe borders (border-left / border-right > 1px as
  colored accent). Use full-width top bars or background tints instead.
- **Don't** use gradient text or glassmorphism. The accent is a single solid
  Stoplight Red.
- **Don't** build SaaS dashboard UI. No admin panels, pricing tiers, "schedule
  a demo", feature-compare tables, testimonial carousels, or identical card
  grids with icon + heading + text.
- **Don't** use the red accent for decorative purposes. If it's not signaling
  pass/fail, it shouldn't be red.
- **Don't** gate content behind animations. The blur-enhance fade-in is a
  treat, not a requirement. Content must be readable without JavaScript.
- **Don't** use numbered section markers (01 / 02 / 03) except where the
  section is literally a sequence (like the How It Works steps).
- **Don't** use tiny uppercase tracked eyebrows ("ABOUT" / "PROCESS" /
  "PRICING") above every section. One strong kicker is voice; repetition is AI
  scaffolding.
- **Don't** use box-shadow on cards, panels, or containers. Flat surfaces with
  tonal borders only.
- **Don't** add hero-metric templates (big number + small label + gradient
  accent). Let the product speak through terminal output, not numbers.
