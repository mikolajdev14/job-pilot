# UI Rules

## Font

Use Inter through `next/font/google` in the root layout.

## Shell

The dashboard is a separate full width screen with top navigation. Find Jobs, job details, and Profile use the shared `Navbar` as a desktop sidebar and mobile top navigation. Their main landmark uses the `app-main` class so the content clears the sidebar. Public screens use the compact public header rendered by the same component. Login intentionally hides global navigation.

## Layout

Use a centered content area with responsive horizontal padding. Keep the protected workspace dense. Prefer a gap of five or six spacing units between major panels. Wide search and table screens may use `max-w-7xl`. Profile and detail screens may use `max-w-6xl`.

## Panels

Every major section uses a charcoal surface, a subtle border, a large radius, and `shadow-card`. Inset controls use `bg-surface-secondary`. Hovered or selected content may use `bg-surface-tertiary`.

## Navigation

Desktop navigation is grouped inside the left sidebar. The active row uses a raised surface, a stronger border, primary text, and a small light indicator. Mobile navigation exposes icon controls with accessible labels and the same active state.

## Typography

Each screen starts with a small uppercase workspace breadcrumb, one visible `h1`, and a short supporting line. Panel titles use sentence case. Uppercase labels are reserved for compact metadata and controls.

## Buttons

Primary actions use the light `accent` token with dark foreground text. Secondary actions use a raised dark surface and visible border. All controls keep a minimum height of eleven spacing units and a visible focus ring.

## Forms

Fields use `surface-secondary` with `border-muted`. Disabled fields use the page background and muted text. Labels remain visible above fields. Placeholder text never replaces a label.

## Tables

Use semantic table elements. Header rows use `surface-secondary`. Body rows use border separators and a raised hover state. Keep tables horizontally scrollable on narrow screens.

## Images

Product screenshots use `dashboard-image` to match the monochrome reference. Avatars may use grayscale. Content images keep their real aspect ratio and meaningful alternative text.

## Accessibility

Every page has one `main` with `id="main-content"`. The root layout provides a skip link. All interactive controls are keyboard reachable. Focus rings use the accent token. Dynamic status, error, empty, and loading states remain visible and announced.

## Restrictions

Do not use built in Tailwind color scales. Do not place color literals in components. Do not add bright gradients to panel backgrounds. Do not remove labels, empty states, loading states, or error states during visual work.
