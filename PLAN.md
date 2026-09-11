# NextGen Consultants — Website Build Plan

**Source specification:** [prompt.md](prompt.md)
**Host:** GitHub Pages — `https://nextgenconsultants.github.io/` (domain root, base path `/`)
**Backend:** none. Microsoft 365 handles everything that receives data.
**Status:** Stage 1 in progress

---

## 1. Constraints

| Constraint | Detail |
|---|---|
| Hosting | GitHub Pages only. No server, no custom domain. |
| Deployment | `.github/workflows/static.yml` — deploys repo root on every push to `main`. |
| Backend | None available. GitHub Pages serves static files and cannot accept a POST. |
| Available services | Microsoft 365: Forms, Bookings, Power Automate. Microsoft Clarity for analytics. |
| Content integrity | The specification prohibits unverified claims in eight separate places. No fake partners, logos, testimonials, statistics, awards, case studies, certifications, or founder details. |

### GitHub Pages limits that shape the build

- **No HTTP headers.** Content-Security-Policy must ship as a `<meta http-equiv>` tag. HSTS and frame headers are not settable at all.
- **No POST handling.** Forms and booking must be delegated to Microsoft 365.
- **Jekyll processing.** If a build step is added later, `.nojekyll` becomes mandatory — Jekyll silently drops underscore-prefixed directories such as Next.js's `_next/`.

---

## 2. Strategy — two stages

The full specification describes 24 pages, a blog pipeline, filterable solution catalogues and complete structured data. That is 15–19 focused working days. Most of it is not what establishes credibility with a first-time visitor.

**Stage 1 ships a complete, credible seven-page site in one day.** Stage 2 expands to the full specification when the content and time exist.

### Why Stage 1 uses plain HTML/CSS/JS and not React

| Factor | Plain HTML/CSS/JS | Next.js + React |
|---|---|---|
| Time to first deploy | Immediate — already working | Half a day on toolchain before any content |
| New failure modes | None | `.nojekyll`, export config, base paths, build breakage |
| Page count it suits | Comfortable to ~15 pages | Necessary beyond ~15 |
| Component reuse | Duplicated header/footer | Shared components |

At seven pages the duplication is manageable and the speed advantage is decisive. The content is written to be lifted wholesale into components when Stage 2 migrates to Next.js.

---

## 3. Stage 1 — today

### Pages

| File | Page | Contents |
|---|---|---|
| `index.html` | Home | Hero, trust strip, 16 service cards, technology ecosystem, solution examples, why-choose-us, 6-step delivery approach, founders preview, training preview, final CTA |
| `services.html` | Services | All six capability categories in full |
| `training.html` | Training | Three tracks, course listings, delivery modes |
| `job-support.html` | Mentoring & Job Support | Positioning, support types, ethics policy |
| `about.html` | About | Story, mission, vision, values, founder profiles |
| `contact.html` | Contact | Inquiry form, booking, contact details |
| `404.html` | Not Found | Custom, on-brand |

### Supporting files

- `assets/css/site.css` — design system and all page styling
- `assets/js/site.js` — navigation, theme, form handling, interactions
- `robots.txt`, `sitemap.xml`

### Included

Responsive mobile-first layout · WCAG 2.2 AA practices (keyboard navigation, visible focus, semantic headings, form labels, reduced-motion support) · per-page title, description, canonical, Open Graph and Twitter metadata · Organization schema · Microsoft-inspired palette per specification.

### Deferred to Stage 2

Blog and MDX pipeline · six deep service-detail pages · filterable solution catalogue · mega menu · Course/FAQ/Breadcrumb schema · full legal page set · engagement models · corporate training page · solutions detail pages.

---

## 4. Design system

Per specification, a premium Microsoft-inspired direction that does not copy Microsoft branding.

| Token | Value | Use |
|---|---|---|
| Primary | Deep blue | Brand, primary actions |
| Secondary | Azure blue | Links, accents |
| AI accent | Violet | AI and Copilot sections |
| Support accent | Teal | Training, secondary highlights |
| Background | White, very light grey | Page and alternate sections |
| Text | Dark navy, charcoal | Body and headings |
| Dark sections | Deep navy gradient | Hero, CTA bands |

Characteristics: clean enterprise consulting style, cards with subtle shadows, rounded corners, soft gradients, clear spacing, restrained micro-interactions, high readability, accessible contrast verified at token-definition time.

---

## 5. Forms and booking

GitHub Pages cannot receive a submission. Microsoft 365 covers every case with no new vendor.

| Need | Solution |
|---|---|
| Consulting, training and job-support inquiries | Branded form → Power Automate HTTP trigger |
| Book a consultation | Microsoft Bookings embed |
| Analytics | Microsoft Clarity, consent-gated |

### Form endpoint risk

A Power Automate HTTP trigger URL is visible in the page source. It is write-only, so nothing leaks, but spam could consume the daily flow-run quota.

Guards: honeypot field, sub-three-second submit rejection, and a Power Automate condition dropping obvious spam before it sends mail. The URL is regenerable if abused.

Zero-risk alternative: embed Microsoft Forms directly, trading visual polish for immunity.

Until the flow exists, form buttons wire to clearly marked placeholders that take one minute to swap.

---

## 6. Information required from the founders

These block final content. Until supplied they render as visible placeholders. **None will be invented** — the specification prohibits it, and fabricated credentials would be damaging for a consultancy.

- Founder names, roles, biographies, photographs
- Certifications actually held
- LinkedIn and GitHub profile URLs
- Business email (Microsoft 365 address — no custom domain yet)
- Contact number, service regions, business hours
- Training schedule and support availability
- Legal business name and registration details
- Privacy contact
- Genuine testimonials or case studies, if any exist

### Setup required on the founders' side

Publish a Microsoft Bookings page · create the Power Automate flow · create a Microsoft Clarity project.

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Placeholder content filled with invention | Medium | High | Visible placeholder markers; nothing fabricated |
| Legal pages published without review | Medium | High | Stubs only in Stage 1. India's DPDP Act and GDPR both apply to the stated target markets; a qualified reviewer must approve before real legal pages ship |
| Form endpoint spam consuming flow quota | Medium | Medium | Honeypot, time-trap, flow-side filtering, regenerable URL |
| Duplicated header/footer drifting across pages | Medium | Low | Acceptable at seven pages; resolved by Stage 2 migration |
| Moving to a custom domain later | Low | Low | Absolute URLs confined to metadata, so the change is contained |

---

## 8. Stage 2 roadmap

Triggered when the remaining pages, blog and filtering are wanted. Migrates to Next.js 15 App Router with `output: 'export'` — static export emits real HTML per route, so GitHub Pages serves each URL directly with no SPA fallback hack, and per-page metadata becomes declarative.

| Phase | Scope | Estimate |
|---|---|---|
| 1 | Next.js + TypeScript + Tailwind foundation, route map, workflow rewrite to build and upload `./out`, `Placeholder<T>` type and CI gate | 1.5 days |
| 2 | Design system as tokens and primitives | 2 days |
| 3 | Global chrome, mega menu, core pages migrated | 3 days |
| 4 | Six service-detail pages, governance maturity model, AI disclaimer | 2.5 days |
| 5 | Training, mentoring, corporate training | 2 days |
| 6 | Solutions catalogue with URL-encoded filters, engagement models, MDX blog | 3.5 days |
| 7 | Full SEO and schema, axe audit, screen-reader pass, CSP, Lighthouse tuning | 2 days |
| 8 | Legal pages, consent-gated analytics, README, launch checklists | 1.5 days |

**Total:** 15–19 focused working days.

---

## 9. Verbatim content requirements

Two passages must be reproduced exactly and never paraphrased — both are risk statements.

**Ethics policy** ([prompt.md:719](prompt.md#L719)) — Mentoring and Job Support page:

> NextGen Consultants provides mentoring, technical guidance, and learning support. We do not impersonate candidates, attend interviews on their behalf, misrepresent experience, complete unauthorized employment assessments, or access customer systems without proper authorization.

**AI suitability disclaimer** ([prompt.md:605](prompt.md#L605)) — any AI or Copilot section:

> AI suitability, model availability, licensing, data residency, and compliance requirements must be assessed for each organization and use case.
