# NextGen Consultants — Website

Marketing and lead-generation site for NextGen Consultants, a Microsoft technology
consultancy offering consulting, development, training, mentoring and professional
job support.

**Live:** https://nextgenconsultants.github.io/

---

## At a glance

| | |
|---|---|
| **Stack** | Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies. |
| **Hosting** | GitHub Pages, served from the repository root at the domain root (base path `/`). |
| **Deployment** | Automatic on every push to `main` via GitHub Actions. Takes about 40 seconds. |
| **Backend** | None. GitHub Pages serves static files and cannot accept a POST — see [Forms and booking](#forms-and-booking). |
| **Pages** | 7 |
| **Shared weight** | ~30 KB CSS + ~13 KB JS across all pages. No web fonts, no images. |

Why no framework: at seven pages the duplicated header and footer are manageable, and
avoiding a toolchain means no build to break and nothing to install before editing a page.
The migration path to Next.js, for when the site grows past ~15 pages, is in
[PLAN.md](PLAN.md).

---

## Repository layout

```
.
├── index.html              Home — hero, services, technology, solutions, approach, founders, CTA
├── services.html           Six capability areas, governance maturity model, engagement models
├── training.html           Three course tracks, delivery modes, corporate training
├── job-support.html        Mentoring and job support, incl. the ethics policy
├── about.html              Story, mission, vision, values, founders, commitments
├── contact.html            Enquiry form, contact details, booking section
├── 404.html                Custom not-found page (absolute paths — see note below)
│
├── assets/
│   ├── css/site.css        Design tokens and all component styles
│   └── js/site.js          Navigation, scroll behaviour, form validation
│
├── robots.txt              Crawler directives, points at the sitemap
├── sitemap.xml             The six indexable pages
│
├── PLAN.md                 Build plan and Stage 2 roadmap (not published)
├── prompt.md               Original specification (not published)
└── .github/workflows/static.yml
```

`404.html` links with absolute paths (`/services.html`) rather than relative ones, because
GitHub Pages can serve it from any URL depth — relative links would resolve against the
wrong base.

---

## Running it locally

No install step. Serve the folder over HTTP and open it:

```bash
python -m http.server 8000
# then visit http://127.0.0.1:8000
```

Any static server works (`npx serve`, the VS Code Live Server extension, and so on).

Opening the `.html` files directly over `file://` mostly works, but the root-relative paths
in `404.html` will not resolve, so prefer a server.

### Checks worth running after a change

```bash
# JavaScript syntax
node --check assets/js/site.js

# Every internal link resolves
for f in *.html; do
  grep -oE 'href="(/|[A-Za-z0-9])[^":]*\.html[^"]*"' "$f" \
    | sed 's/href="//;s/"$//;s/#.*//;s|^/||' | sort -u \
    | while read -r t; do [ -f "$t" ] || echo "BROKEN: $f -> $t"; done
done
```

---

## Deployment

[`.github/workflows/static.yml`](.github/workflows/static.yml) runs on every push to `main`:

1. Checks out the repository
2. **Deletes `prompt.md`, `PLAN.md` and `README.md` from the CI checkout**, so internal
   documents are never served from the public site (the files stay in version control —
   only the ephemeral CI copy is affected)
3. Uploads the repository root as a Pages artifact
4. Deploys

There is no build. What is in the repository is what gets served.

### GitHub Pages constraints worth knowing

- **No HTTP headers.** Content-Security-Policy must ship as a `<meta http-equiv>` tag;
  HSTS and frame headers cannot be set at all.
- **No POST handling.** Anything that receives data must be delegated elsewhere.
- **`.nojekyll` matters if a build is ever added.** Jekyll silently drops
  underscore-prefixed directories, which would break a Next.js `_next/` folder.

---

## Configuration

All runtime configuration lives in one object at the top of
[`assets/js/site.js`](assets/js/site.js):

```js
var CONFIG = {
  formEndpoint: "",      // Power Automate HTTP trigger URL
  fallbackEmail: "",     // shown if the form cannot send
  minSubmitSeconds: 3    // time-trap threshold
};
```

### Connecting the contact form

The form is **not connected yet**. It validates fully, then tells the visitor plainly that
it cannot send — and says so above the form as well, rather than letting someone type a
long enquiry first.

To connect it:

1. In Power Automate, create a flow with the **When an HTTP request is received** trigger.
2. Set the request body schema to match the payload below.
3. Add a condition that drops obvious spam, then send yourself an email or write to a list.
4. Save the flow, copy the generated URL, and paste it into `CONFIG.formEndpoint`.
5. Set `CONFIG.fallbackEmail` to your business address.
6. Remove the "not connected yet" notice above the `<form>` in
   [`contact.html`](contact.html).

Payload posted as JSON:

```json
{
  "name": "Example Person",
  "email": "person@example.com",
  "phone": "",
  "organisation": "",
  "country": "India",
  "inquiryType": "Consulting",
  "technologies": "Power Apps, Dataverse",
  "message": "Free-text requirement, minimum 20 characters.",
  "submittedAt": "2026-09-11T12:40:00.000Z",
  "sourcePage": "/contact.html"
}
```

> **Security note.** A Power Automate trigger URL is visible in the page source, so anyone
> viewing source can post to it. It is write-only, so nothing leaks, but spam could consume
> your daily flow-run quota. Two guards are already in place — a honeypot field and a
> sub-three-second submit rejection — and the flow should filter further. The URL can be
> regenerated if it is ever abused. If you would rather have zero abuse surface, embed
> Microsoft Forms instead and drop the custom form.

### Online booking

[`contact.html`](contact.html) embeds the Microsoft Bookings page directly in the `#book`
section, inside a `.booking-embed` iframe wrapper. Every "Book a Consultation" link across
the site points at `contact.html#book`, so the calendar itself lives in one place rather
than being duplicated per page. To point it at a different Bookings page, update the
`iframe src` in `contact.html`.

---

## Forms and booking

GitHub Pages cannot receive a submission, so anything that accepts data is delegated to
Microsoft 365 — which adds no new vendor, since the accounts already exist.

| Need | Solution | Status |
|---|---|---|
| Enquiries | Branded form → Power Automate HTTP trigger | Not connected |
| Booking | Microsoft Bookings embed | Connected |
| Analytics | Microsoft Clarity, consent-gated | Not added |

---

## Content still to be supplied

22 placeholders across 6 pages are **deliberately left blank rather than invented**. The
specification prohibits unverified claims in eight separate places, and publishing
credentials nobody holds would undermine the site's entire purpose.

They render with a visible amber marker so they cannot reach production unnoticed.

| Needed | Appears on |
|---|---|
| Founder names, roles, biographies, photographs, certifications | `index.html`, `about.html` |
| LinkedIn and GitHub profile URLs | `index.html`, `about.html` |
| Business email and contact number | `about.html`, `contact.html` |
| Legal business name and registration details | `about.html` |
| Service regions and business hours | `about.html`, `contact.html`, `services.html` |
| Training batch dates, duration, certificate policy | `training.html` |
| Support plan options and availability | `job-support.html` |
| Response-time commitment | `contact.html` |

To find them all:

```bash
grep -rn 'class="placeholder"\|placeholder-note' *.html
```

---

## Editing content

Header and footer markup is duplicated across the seven pages. When changing navigation or
footer links, **change every page** — there is no template to edit. Verify with:

```bash
grep -c 'nav-link' *.html   # should be identical across pages
```

Two passages are reproduced verbatim from the specification and **must not be
paraphrased**, as both are risk statements:

- **Ethics policy** — [`job-support.html`](job-support.html), summarised on `about.html`
- **AI suitability disclaimer** — `index.html`, `services.html`, `training.html`, `about.html`

### Content rules

Do not add client logos, testimonials, case studies, project statistics, awards, partner
badges, or claims of Microsoft partner status, unless they are genuine and you have
permission to publish them. Present example solutions as capabilities, never as completed
customer projects. Do not promise guaranteed AI accuracy, project outcomes, or job
placement.

---

## Design system

Tokens are defined once at the top of [`assets/css/site.css`](assets/css/site.css).

| Role | Token | Value |
|---|---|---|
| Primary | `--primary` | `#0f3d91` deep blue |
| Secondary | `--azure` / `--azure-text` | `#1a8fe0` / `#0b6aad` |
| AI accent | `--violet` / `--violet-text` | `#7b4ddb` / `#6234c0` |
| Support accent | `--teal` / `--teal-text` | `#0f9b8e` / `#0a746a` |
| Text | `--text` / `--text-muted` | `#0f1b33` / `#56617d` |
| Dark sections | `--navy-from` → `--navy-to` | `#0a1c3d` → `#143168` |

Several colours have two variants: a saturated one for icons, fills and large text, and a
darker one that clears WCAG AA as body text on white. **Never use the decorative variant
for small text** — that is what the `-text` suffix exists for.

Typography uses a system font stack led by Segoe UI. No web fonts are loaded, which keeps
first paint fast and avoids a layout shift.

---

## Accessibility

Built to WCAG 2.2 AA practices:

- All 22 foreground/background pairs verified against AA contrast — lowest is 3.47:1 on the
  focus ring, which requires 3:1
- Skip link, semantic landmarks, one `h1` per page, no skipped heading levels
- Keyboard-operable navigation with a focus trap in the mobile menu, Escape to close, and
  focus returned to the toggle
- Visible focus indicators throughout
- Form labels bound to inputs; errors exposed via `aria-invalid` and an `<output>` region
- Decorative SVGs hidden from the accessibility tree
- `prefers-reduced-motion` honoured

When adding a colour, check its contrast before using it. When adding a section, check the
heading level follows the one before it.

---

## SEO

Every page has a unique title, meta description, canonical URL, and Open Graph and Twitter
Card tags. `index.html` carries Organization schema; the others carry BreadcrumbList
schema. `sitemap.xml` lists the six indexable pages, and `404.html` is `noindex, follow`.

Update `sitemap.xml` when adding or removing a page.

If a custom domain is added later, update the canonical and `og:url` values on every page,
plus the URLs in `sitemap.xml` and `robots.txt`.

---

## Roadmap

[PLAN.md](PLAN.md) holds the full build plan, including Stage 2: the migration to Next.js
with static export, and the remaining pages from the specification — six service-detail
pages, a solutions catalogue with filtering, an MDX blog, and the full legal page set.

---

## Licence

© NextGen Consultants. All rights reserved. Not licensed for reuse.
