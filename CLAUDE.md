# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing/lead-gen site for NextGen Consultants, a Microsoft technology consultancy
(consulting, development, training, mentoring, job support). Plain HTML/CSS/JS, no
framework, no build step, no dependencies, no backend. Served by GitHub Pages from the
repo root (base path `/`). Deploys automatically on every push to `main` via
`.github/workflows/static.yml` (~40s).

Full narrative documentation — deployment details, form/booking wiring, design tokens,
content rules, placeholder inventory — lives in `README.md`; read it before making
non-trivial changes, since this file only covers what a coding agent needs operationally.

## Commands

No package manager, no build. Useful checks after editing:

```bash
# Serve locally (root-relative paths in 404.html need a real server, not file://)
python -m http.server 8000

# JS syntax check
node --check assets/js/site.js

# Every internal link resolves
for f in *.html; do
  grep -oE 'href="(/|[A-Za-z0-9])[^":]*\.html[^"]*"' "$f" \
    | sed 's/href="//;s/"$//;s/#.*//;s|^/||' | sort -u \
    | while read -r t; do [ -f "$t" ] || echo "BROKEN: $f -> $t"; done
done

# Nav link count should match across all pages (header/footer are duplicated, not templated)
grep -c 'nav-link' *.html

# Find remaining content placeholders
grep -rn 'class="placeholder"\|placeholder-note' *.html
```

There is no lint/test suite. `.github/workflows/static.yml` does the deploy: it checks out
the repo, **deletes `prompt.md`, `PLAN.md`, `README.md` from the CI copy only** (kept in
git history, just not published), uploads the root as the Pages artifact, and deploys.
What's in the repo is what gets served — nothing is compiled or bundled.

## Architecture

- **7 pages, no templating**: `index.html`, `services.html`, `training.html`,
  `job-support.html`, `about.html`, `contact.html`, `404.html`. Header and footer markup is
  copy-pasted into every page — there is no include mechanism. When changing nav or footer,
  **edit every page** and re-check with the `nav-link` grep count above.
- `404.html` is the one page that uses absolute paths (`/services.html` etc.) instead of
  relative ones, because GitHub Pages can serve a 404 from any URL depth.
- **Styling**: all tokens and component styles live in one file, `assets/css/site.css`
  (~1000 lines). Design tokens (colors, etc.) are defined once at the top — see README's
  "Design system" table for the palette. Several colors have a saturated variant (icons,
  fills, large text) and a darker `-text` variant (WCAG AA-safe body text on white) —
  never use the decorative variant for small text.
- **Behavior**: all JS is in one file, `assets/js/site.js` (~360 lines) — nav
  toggle/scroll behavior and contact-form validation/submission. Runtime config is one
  object near the top (`CONFIG.formEndpoint`, `CONFIG.fallbackEmail`,
  `CONFIG.minSubmitSeconds`).
- **No backend, ever**: GitHub Pages can't accept POST requests. Anything that receives
  data (contact form, booking) is delegated to Microsoft 365 (Power Automate HTTP trigger,
  Microsoft Bookings embed). The contact form is currently **not connected** — it validates
  fully client-side then tells the visitor it can't send yet. See README "Configuration" /
  "Connecting the contact form" before wiring it up.
- **GitHub Pages constraints that shape decisions**: no custom HTTP headers (CSP must be a
  `<meta http-equiv>` tag; HSTS/frame headers aren't settable at all); no POST handling; if
  a build step is ever introduced, `.nojekyll` becomes mandatory (Jekyll silently drops
  underscore-prefixed directories like a Next.js `_next/`).

## Content rules (non-negotiable, per original spec)

- 22 placeholders across the pages are **deliberately left blank, not invented** — founder
  names/bios/photos/certifications, LinkedIn/GitHub URLs, business email/phone, legal
  entity details, service regions/hours, training dates, support-plan details,
  response-time commitments. They render with a visible amber marker
  (`class="placeholder"` / `placeholder-note`) so they can't silently reach production.
  Do not fill these with invented content.
- Never add client logos, testimonials, case studies, project statistics, awards, partner
  badges, or Microsoft-partner-status claims unless genuine and cleared for publication.
  Example solutions must be presented as capabilities, not completed customer projects.
  Never promise guaranteed AI accuracy, project outcomes, or job placement.
- Two passages are reproduced verbatim from the original spec and must never be
  paraphrased (both are risk/liability statements):
  - **Ethics policy** — in `job-support.html`, summarized on `about.html`.
  - **AI suitability disclaimer** — in `index.html`, `services.html`, `training.html`,
    `about.html`.
- Accessibility target is WCAG 2.2 AA (already verified: contrast, skip link, landmarks,
  heading order, keyboard nav with focus trap in mobile menu, visible focus rings, labeled
  form fields with `aria-invalid`, `prefers-reduced-motion`). When adding a color, check its
  contrast; when adding a section, keep heading levels sequential.
- Every page carries unique title/description/canonical/OG/Twitter metadata and JSON-LD
  (Organization on `index.html`, BreadcrumbList elsewhere). Update `sitemap.xml` when
  adding or removing a page.

## Roadmap context

`PLAN.md` (internal, not published) documents the deliberate choice to ship Stage 1 as
plain HTML/CSS/JS at 7 pages rather than the full 24-page React/Next.js spec in
`prompt.md` (also internal, not published) — duplication is manageable at this size and
avoids a toolchain. Stage 2, triggered when the site outgrows ~15 pages, migrates to
Next.js 15 with `output: 'export'`; see `PLAN.md` §8 for the phased plan if asked to work
toward it.
