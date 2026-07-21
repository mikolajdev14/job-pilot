source: image

# JobPilot design direction

JobPilot uses a dark monochrome workspace inspired by a compact financial dashboard. The application sits on a near black canvas. Charcoal panels, quiet borders, compact labels, white actions, and restrained status colors create a focused control room for job search work.

## Build mandate

Use the supplied dark dashboard reference as the visual source. Every page uses the same full width top navigation with Dashboard, Find Jobs, and Profile as separate destinations. Do not use a sidebar. Keep cards dense, borders subtle, corners softly rounded, and hierarchy clear. Use `app/globals.css` as the only source of visual values.

## Composition

Dashboard and work screens start with a small workspace breadcrumb, a clear page title, and grouped panels. Forms use dark inset controls. Tables use quiet row separators and a raised hover state. Primary actions are light with dark text. Secondary actions stay on raised charcoal surfaces.

## Responsive behavior

The top navigation wraps into a dedicated link row on narrow screens. Grids stack on narrow screens. Actions keep a minimum touch target. Tables scroll horizontally when their columns cannot collapse. No content may overflow the viewport.
