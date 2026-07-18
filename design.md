source: image

# JobPilot design direction

JobPilot uses a calm, editorial SaaS interface: generous white cards on a soft gray canvas, crisp dark typography, restrained purple actions, and semantic status colors. Long product forms use clear fieldsets, thin borders, compact labels, and a single focused content column.

## Build mandate

Match the supplied product screenshots faithfully. Use the existing Navbar and Footer patterns, keep page surfaces light and spacious, and use the CSS tokens in `app/globals.css` as the only source of visual values. New screens should be responsive and accessible without changing the established visual language.

## Responsive behavior

Desktop layouts may use two-column form grids inside the centered content column. At mobile widths, fields stack, actions become full width where needed, and no content may overflow horizontally.
