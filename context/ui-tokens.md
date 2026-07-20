# UI Tokens

The token source for JobPilot is `app/globals.css`. The current system is dark and monochrome. Components only use semantic Tailwind utilities generated from the tokens below.

## Usage

```tsx
className="bg-surface text-text-primary border-border"
```

Never use a color literal or a built in Tailwind color scale inside a component.

## Core palette

| Purpose | Token | Utility example |
| --- | --- | --- |
| Page canvas | `--color-background` | `bg-background` |
| Main panel | `--color-surface` | `bg-surface` |
| Inset control | `--color-surface-secondary` | `bg-surface-secondary` |
| Raised hover | `--color-surface-tertiary` | `bg-surface-tertiary` |
| Quiet area | `--color-surface-muted` | `bg-surface-muted` |
| Standard border | `--color-border` | `border-border` |
| Strong border | `--color-border-muted` | `border-border-muted` |
| Primary text | `--color-text-primary` | `text-text-primary` |
| Supporting text | `--color-text-secondary` | `text-text-secondary` |
| Muted text | `--color-text-muted` | `text-text-muted` |
| Primary action | `--color-accent` | `bg-accent` |
| Action text | `--color-accent-foreground` | `text-accent-foreground` |

Values use `oklch()` in `app/globals.css`. This keeps perceptual contrast predictable and avoids color literals in components.

## Status colors

Status colors remain available for information that needs meaning beyond the monochrome shell.

| State | Foreground | Quiet surface |
| --- | --- | --- |
| Success and strong match | `success` | `success-lightest` |
| Information | `info-dark` | `info-lightest` |
| Warning | `warning` | `warning/10` |
| Error | `error` | `error/10` |

Status must always include text or an icon. Color alone cannot carry meaning.

## Geometry

| Element | Rule |
| --- | --- |
| Small control | `rounded-md` |
| Button or field | `rounded-lg` |
| Main panel | `rounded-xl` |
| Tag and avatar | `rounded-full` |
| Panel depth | `shadow-card` |
| Large shell depth | `shadow-panel` |

## Typography

Inter is loaded with `next/font/google` in `app/layout.tsx`.

| Use | Classes |
| --- | --- |
| Page title | `text-3xl font-semibold tracking-tight` |
| Section title | `text-lg font-semibold` |
| Panel label | `text-xs font-semibold uppercase tracking-widest` |
| Body | `text-base leading-6` |
| Compact metadata | `text-xs text-text-muted` |

## Components

### Panel

`rounded-xl border border-border bg-surface shadow-card`

### Primary action

`min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground hover:bg-accent-dark`

### Secondary action

`min-h-11 rounded-lg border border-border-muted bg-surface-secondary px-4 py-2 text-text-primary hover:bg-surface-tertiary`

### Field

`min-h-11 rounded-lg border border-border-muted bg-surface-secondary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20`

### Focus

Every interactive element uses a visible `focus-visible:ring-2 focus-visible:ring-accent` state. Add a matching ring offset when the element sits directly on the page canvas.

## Invariants

The dark palette is the default mode. The sidebar appears only on protected screens at desktop width. Public screens share the same panels and actions. Components never contain hex, rgb, or hsl color literals. New values must be added to `app/globals.css` first.
