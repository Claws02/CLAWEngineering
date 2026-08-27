---
title: CLAW Engineering Portfolio — Full Audit
date: 2026-08-27
status: reviewed
tags: [portfolio, clawengineering, audit, web]
---

# CLAW Engineering Portfolio — Full Audit

Commit audited: `af046a4` · 4 pages, 15 catalogued projects, 1,223 lines of CSS,
387 lines of JS, 65 passing assertions.

---

## Verdict first

The build quality is genuinely above what a personal site needs to be. The drawing-set
design system is coherent and distinctive, the code is dependency-free and tested in CI,
and the escaping/fallback/reduced-motion handling is the work of somebody who thought
about failure modes. **That is not the problem.**

The problem is that the site is a very well-engineered container for evidence that
isn't in it yet. Fourteen of your fifteen projects describe outcomes with no number in
them. There is no link to a single line of your source code. The one peer-reviewed
credential on the site — the thing that actually separates you from every other 2026
M.S. grad — is a citation with a dead-commented DOI link and no PDF. A hiring manager
who spends ninety seconds here learns that you are tasteful and that you have built a
lot of things, but leaves without a single fact they could repeat to somebody else.

Ranked honestly:

| | Area | State |
|---|---|---|
| 🟢 | Design system, typography, layout | Strong. Leave it alone. |
| 🟢 | Front-end engineering, tests, CI | Strong. Above bar. |
| 🟡 | Accessibility | Good bones, one systemic contrast failure |
| 🟡 | SEO / discoverability | Structurally capped — see §E |
| 🔴 | **Evidence and specificity of the work** | **The real gap** |
| 🔴 | **Consulting-track conversion** | No proof, no price, no path |
| 🔴 | Employment-track call to action | Missing entirely |

The rest of this document is the detail.

---

## §A — Blockers: things that break or embarrass in public

These are confirmed defects, not opinions. Each is a small fix.

### A1. `scripts/localize-images.sh` is broken and will lie to you 🔴

`scripts/localize-images.sh:11`

```bash
urls=$(grep -oE 'https://i\.imgur\.com/...' assets/js/projects.js index.html | sort -u)
```

`grep -o` across **two** files prefixes every match with the filename, so `$urls`
actually contains:

```
assets/js/projects.js:https://i.imgur.com/485HbJQ.png
```

`curl` then treats `assets` as the hostname. I ran it: **exit code 6, "Could not
resolve host: assets"**, for every URL. The script's error handler prints
`FAILED — <url> is dead. Replace this image manually.` and continues — so running
this script downloads nothing, rewrites nothing, and tells you all fifteen of your
images are dead when they may be perfectly fine.

This is the one script your own README tells you to run before going live.

**Fix:** add `-h` to suppress filename prefixes.

```bash
urls=$(grep -hoE 'https://i\.imgur\.com/[A-Za-z0-9]+\.(png|jpe?g)' assets/js/projects.js index.html | sort -u)
```

### A2. Fifteen images hotlinked from Imgur 🔴

15 distinct `i.imgur.com` URLs across `assets/js/projects.js` and `index.html:157`
(that last one is **your portrait**). Every photograph on the site — the swarm sim,
the Simulink model, the ion thruster, the lumbar pillow, your face — is served by a
third party you don't control, with `referrerpolicy="no-referrer"` set, which is
precisely the condition under which Imgur has historically broken hotlinks.

I could not test whether they currently resolve; this sandbox blocks all outbound
HTTPS (403 at the proxy for `i.imgur.com` *and* `example.com`). So treat liveness as
**unknown**, not as broken.

The `guardImage` fallback is well built — a hatched placeholder with the sheet number
instead of a broken-image icon — but a portfolio where every plate degrades to
"P-07" in a grey box is not a portfolio.

**Fix:** A1 first, then run the repaired script, then commit `assets/img/projects/`.

### A3. `404.html` breaks on GitHub Pages 🟠

`404.html` uses absolute paths — `/assets/css/site.css`, `/assets/img/favicon.svg`,
`href="/"`, `href="/projects.html"` — while all three real pages use relative paths.

On Cloudflare Pages at an apex domain this is fine. On the GitHub Pages fallback your
README documents (`claws02.github.io/CLAWEngineering/`), every one of those resolves
against `claws02.github.io/` instead of the project subpath. Result: an **unstyled**
404 page whose two escape links both go nowhere. The page that exists specifically to
recover a lost visitor loses them harder.

**Fix:** make them relative (`assets/css/site.css`, `index.html`, `projects.html`).

### A4. Undefined CSS token silently changes your hero 🟡

`assets/css/site.css:372`

```css
.track-lead .track-body { font-size: var(--fs-base); ... }
```

`--fs-base` **does not exist**. The tokens define `--fs-body`. An undefined custom
property with no fallback makes the declaration invalid at computed-value time, so
`font-size` falls back to inherited (`1.0625rem`) rather than the `--fs-sm`
(`0.9375rem`) that `.track-body` sets. The CLAW panel's body copy renders larger than
designed. It doesn't look broken, which is why it survived — but it wasn't a decision.

I checked every other `var()` in the file; this is the only undefined one.

**Fix:** `var(--fs-body)`.

### A5. README has drifted from the repo 🟡

Three items on your "Before you go live" checklist are already done or wrong:

- Line 121 — *"Move the résumé into the repo. It is served from a Dropbox share link today."* There is no Dropbox link anywhere in the repo. `index.html:444` already points at `assets/docs/caleb-lawson-resume.pdf`, which is present, 82 KB, PDF 1.7, tagged with `StructTreeRoot` and `Lang(en)` — a properly accessible PDF, nicely done.
- Line 127 — *"Add your B.S. line to the education row."* Already there, twice (`index.html:107` and `:148`).
- Line 151 — *"64 assertions."* The suite now reports **65 passed, 0 failed**.

A checklist you've learned to ignore is worse than no checklist, because A1 and A2 are
sitting on the same list.

---

## §B — What is actually lacking: the content

This section is the reason the audit exists. Everything above is twenty minutes of work.
This is the part that decides whether the site does its job.

### B1. Fourteen of fifteen projects report no measurable outcome 🔴

I extracted every `notes.Result` field and searched for quantities. Exactly **one**
project states a hard number: P-10, *"accurate to ±0.1 °C."*

The others read like this:

> P-01 — "A working system concept that **measurably improves** situational awareness."
> P-04 — "Running tool with six unit and end-to-end tests passing."
> P-13 — "Working app covering core MEP and NEC material."
> P-07 — "Working actuator control with slow, precise increments."

"Measurably improves" without the measure is the exact phrase a reviewer reads as
*didn't measure it*. P-08 is the near-miss that proves the point: it names the spec
(15 rad/s, ≤1% overshoot, <50 ms settling) in **Problem**, then in **Result** says
"met the primary performance targets" and that settling "ran slightly longer than
simulated" — without the two numbers that would make it the strongest entry on the
site. You have the plot. You captured measured-vs-simulated. Put the numbers in.

This is the single highest-leverage change available to you, and it costs no code.

**Target:** every `Result` contains at least one of — a measured value with units, a
delta against a spec, a time or cost saved, a count, or an explicit negative result
with the bound you established. P-09 already does the last one well: *"No — gap
distance did not change thrust to any notable degree. A negative result, and a clean
one."* That is a good entry. Give it the thrust range you swept and it's excellent.

### B2. No link to any source code, anywhere on the site 🔴

I grepped all four pages and both scripts. There is **not one GitHub link** on this
portfolio — not in the nav, not in the footer, not in the contact channels, not in the
`sameAs` array of your `Person` schema, not on a single project card.

You have CLAW Bench (TypeScript, React, ngspice-to-WASM), an MLB pipeline
(PostgreSQL/Docker/LightGBM), VoltIQ, a VR lab, and Verilog on a DE10-Lite. For
software and firmware roles, the repository *is* the portfolio; the write-up is the
abstract. A reviewer who wants to see how you actually write code currently has no
route from this site to any code at all, including the site itself.

**Fix:** a `repo:` field on the catalog schema rendering as a link in the card and the
modal, plus GitHub in the footer, the contact channels, and `sameAs`. If a repo is
private or messy, omitting that one project's link is fine — omitting all fifteen
reads as having nothing to show.

### B3. The IEEE paper — your best credential — is unreachable 🔴

`index.html:279–335` builds a beautiful record card for the SII 2026 paper. It contains
the title, the author list with you bolded, and the venue. It contains **no way to read
it**, because the only link is commented out at `index.html:323`:

```html
<!-- Add the IEEE Xplore DOI here once the paper is indexed:
     <p class="paper-link"><a class="btn btn-ghost" href="https://doi.org/xxxx">…</a></p> -->
```

This is a peer-reviewed IEEE publication with you as third author. It is, by a
distance, the most credible object on the site, and right now it is an unverifiable
claim in a nice box. A skeptical reader cannot confirm it exists.

**Fix, in order of preference:** (1) the DOI once Xplore indexes it; (2) the accepted
author manuscript as a PDF in `assets/docs/` — check your IEEE copyright transfer, the
accepted version is normally postable on a personal site; (3) at minimum, the
conference programme listing. Also add `ScholarlyArticle` structured data — it is a
distinct rich-result type and you're leaving it on the table.

### B4. Evidence density is wildly uneven 🟠

Plates per project: P-01 has 5, P-07 has 3, P-08 and P-11 have 2, and **eleven
projects have exactly one** — and for nine of those the single plate is a *generated
SVG schematic*, not a photograph of a thing that exists.

Your own README says it plainly: *"A photo of hardware that exists always beats a
diagram of it."* The generated plates are good — the same 800×500 viewBox, in-palette,
drawing the real mechanism — and as stand-ins they're far better than grey boxes. But
nine of fifteen projects currently have zero photographic proof, including the ion
thruster and the thermistor thermometer, which are physical objects you built and
presumably still own.

### B5. The consulting page cannot convert 🔴

`services.html` is well written — five clearly scoped offers, a four-step process,
"you know the price and the deliverable before any work begins." It is missing all
three things that make a stranger send the enquiry:

1. **No social proof.** No client name, no testimonial, no anonymised engagement, no logo, not one sentence of "I did this for someone and it worked." Zero.
2. **No price anchor.** *"Rates depend on scope and are quoted in the proposal."* True, and useless — a visitor cannot tell whether you're a $75/hr student or a $200/hr specialist, so the cautious ones don't start the conversation. A range, a typical engagement size, or a fixed-price starter offer ("PCB design review, 3 business days, $X") lets people self-qualify.
3. **No CLAW work in the project index.** All fifteen catalogue entries are coursework, capstone, or personal builds. The Founder entry says the practice does client work; nothing on the site demonstrates any.

Honest read: the consulting page currently converts people who *already* trust you.
For anyone else it's a well-designed brochure with nothing to check.

Also — `entry-dates` on the Founder role says **"2026 — Present"** while the practice
has no dated engagements. A visitor doing the arithmetic in August 2026 sees a
consultancy under a year old with no listed clients. That's fine and normal; it just
means the proof has to come from somewhere, and right now it comes from nowhere.

### B6. The employment track has no call to action at all 🟠

Your README describes the site as *"Dual-track: an employment track (home, projects)
and a CLAW Engineering consulting track."* The home page no longer reflects that. The
`.tracks` grid is `tracks-single` with one panel — CLAW — and the CSS proves the other
one was deleted: `.track-hire .track-tag` (`site.css:362`) and `.track-hire .track-go`
(`:416`) are dead rules matching nothing in any HTML file.

So the hero funnels every visitor toward consulting, and the hiring path is: scroll
past five sections to Contact, then notice "Résumé — Download PDF" as the third of four
links. The title block says **"Status: Available for projects"**, which a recruiter
reads as *not looking for a job*.

For a 2026 M.S. graduate this is backwards. Either restore a second panel, or change
the status line to something unambiguous ("Open to full-time roles · Available for
project work") and lift the résumé into the hero.

### B7. Modal write-ups are too thin to be case studies 🟡

Four fields, one to two sentences each. Good discipline, but it caps depth: there is
nowhere to put a design decision you'd defend in an interview, a tradeoff you took, a
constraint that shaped the answer, or the thing that went wrong. "Next pass" is the
best field you have — it's the one that shows engineering judgment rather than a task
list — and it's the shortest.

Missing across the board: **tools/stack per project beyond three tags**, **duration**,
**team size and your actual slice**, and **what failed first**. P-01 is a four-person
interdisciplinary capstone that became an IEEE paper — the modal doesn't say how many
people, over how long, or which parts were yours versus your co-authors'.

Note that tags beyond the third are silently dropped from cards (`site.js:87`,
`.slice(0, 3)`). P-01's "TensorFlow", P-04's "ngspice WASM" and P-14's "KiCad" — three
of your most credible keywords — never appear on the card. They do show in the modal.

### B8. The project index isn't ordered 🟡

Catalog order by year reads: `2025 2026 2026 2026 2025 2025 2024 2024 2023 2023 2023
2025 2026 2026 2026`. Broadly reverse-chronological, then P-12 through P-15 restart at
2025–2026. There is no sort control and no chronology, so "Everything I have built"
presents as an unordered pile. Discipline filters exist; a **Newest / Oldest** toggle or
a simple date sort would cost ~10 lines in `initFilters`.

Also: 15 projects under the heading *"Everything I have built"* is a slightly risky
claim — it invites the reader to conclude this is all of it. *"Selected work, 2023–2026"*
promises less and delivers more.

---

## §C — Design and visual polish

The design system is the strongest thing here. These are refinements, not repairs.

### C1. Photos and schematics get the same treatment, and it flatters neither 🟠

`site.css:655` — `.card-figure img { object-fit: contain; padding: 0.75rem; }` on a
`--paper-3` field, 16:10.

For the nine generated SVGs this is exactly right: they're drawn at 800×500, so they
fill the frame and the padding reads as a drawing margin. For the six **photographs**
it's wrong — a 4:3 or 3:4 photo gets letterboxed inside a 16:10 box *and* inset by
12px, so a picture of your ion thruster occupies maybe 55% of its own card with grey
on all four sides. Photos look like inserts; drawings look like plates.

**Fix:** flag the catalog entry (`kind: "photo" | "plate"`) and give photos
`object-fit: cover; padding: 0`. Photos fill their frame, drawings keep their margin,
and the grid reads as one system instead of two.

### C2. Plates are stuck at thumbnail size 🟠

`.plates` is `repeat(auto-fit, minmax(230px, 1fr))` inside a 940px modal, so P-01's
five plates land at roughly 230–290px wide with `object-fit: contain`. Those plates are
a Simulink model, a swarm flow chart, a containment-line inference, a logic-gate
diagram, a measured-vs-simulated step response. **They are the evidence, and they are
unreadable at that size.** There is no lightbox, no zoom, no click-through to the full
image.

For an engineering portfolio this is the highest-value visual fix on the list: any
click-to-enlarge, even opening the image in a new tab, unlocks material you've already
produced.

### C3. Only one plate per card, in a modal built for many 🟡

Eleven projects show a single plate in a grid designed for a set, so the modal's
`.plates` region renders one lonely 230px figure above the notes. Either give those
projects a second and third plate (photo, bench setup, scope capture, CAD view), or let
a single plate span the full modal width.

### C4. Small refinements worth having 🟢

- **Dead CSS** — `.track-hire` (`:362`, `:416`), `.hero-role .sep` (`:324`), `.plot-v` (`:1198`) match nothing in any page. `.plot-v` is a whole keyframe animation that never runs.
- **`color-scheme: light`** is not declared. In a dark-mode browser your form inputs, scrollbars and autofill can render dark inside a paper-white page. One line in `:root`.
- **`theme-color`** meta is absent on all four pages — mobile Safari/Chrome will paint their default chrome above your paper background instead of matching it.
- **`og:image:alt`** is absent. The 1200×630 card is correctly sized (verified), just undescribed.
- **`sitemap.xml`** carries no `<lastmod>`. Cheap signal, currently unused.
- **`services.html` loads `projects.js`** (~10 KB catalog) and never renders a grid. Harmless, but it's dead weight on your highest-intent page.
- **Contact form has no honeypot.** Both forms post to the same Formspree endpoint `xdkdqrwn`; only the services one sets `_subject`. Add `_gotcha` to both, and a `_subject` to the home form so enquiries and job mail separate in your inbox.

---

## §D — Accessibility

Better than most portfolios: skip link, `:focus-visible` ring, `aria-expanded` on the
nav toggle, `aria-pressed` on filters, `role="status"` + `aria-live` on form feedback,
a real `prefers-reduced-motion` block, `visually-hidden` labels on every card button,
and `<article>` rather than `<button>` wrappers so headings stay legal — with tests
enforcing it. Genuinely good work.

Three real gaps.

### D1. `--graphite-2` fails WCAG AA everywhere it is used 🟠

Measured, not estimated:

| Foreground | Background | Ratio | AA normal (4.5) |
|---|---|---|---|
| `--graphite-2` `#7b838d` | `--paper` `#fbfbf9` | **3.70** | ✗ |
| `--graphite-2` | `--paper-2` `#f4f4f0` | **3.48** | ✗ |
| `--graphite-2` | `--paper-3` `#ecece7` | **3.24** | ✗ |
| `--redline` `#cc2936` | `--paper-3` | **4.50** | ✗ (borderline) |
| `--graphite` `#565f6b` | `--paper` | 6.25 | ✓ |
| `--blue` `#2563eb` | `--paper` | 4.99 | ✓ |
| `--ink` `#14181c` | `--paper` | 17.22 | ✓ |

`--graphite-2` carries almost every mono label on the site — `.sheet-no`, `.tb-key`,
`.card-no`, `.mark-sub`, `.hero-eyebrow`, `.portrait-cap`, `.plate-cap`, `.note dt`,
`.fact dt`, `.field label`, `.offer-for`, `.paper-cite`, `.pm-cell dt`, `.colophon` —
at **10px and 11px**, which is unambiguously "normal" text, not large. The large-text
exemption (18.7px bold / 24px) does not apply to any of it.

**Fix:** darken `--graphite-2` to roughly `#6a727c` (≈4.5:1 on paper) or `#667079`
(≈4.7:1, safe on `--paper-3` too). The visual hierarchy survives; it's a few percent of
lightness. This one token change fixes every instance at once.

### D2. The modal doesn't trap focus 🟠

`initModal` (`site.js:196`) does the hard parts right — stores `lastFocus`, focuses the
close button on open, restores focus on close, closes on Escape and on backdrop click,
locks body scroll. But there is **no focus trap and no `inert`** on the background. A
keyboard or screen-reader user tabbing past the modal's last element walks straight
into the page behind it — which is visually obscured and marked `aria-hidden`, so they
are now focused on content they cannot see.

**Fix:** either cycle Tab/Shift+Tab within `.modal-panel`, or set
`main.inert = true` (plus the masthead and footer) while open. `inert` is ~5 lines and
now broadly supported.

### D3. Structure gaps 🟡

- **`projects.html` has one heading in its static HTML** — the `h1` — and then jumps straight to JS-rendered `h3` card titles. That's a skipped level, and it means a screen-reader user landing with a slow script gets a page with a title and nothing else.
- **`[data-filter-count]`** (`projects.html:65`) updates on every filter click but is a plain `<p>`. Add `aria-live="polite"` so the announcement — "4 sheets · embedded" — actually reaches assistive tech. That string is already well written; it just isn't spoken.
- **No `<noscript>` anywhere.** With JS off or failed, `projects.html` renders a heading, four filter buttons and an empty bordered box. Every project on the site is JS-rendered from `window.CLAW_PROJECTS`. A four-line `<noscript>` pointing at the résumé and your email costs nothing.

---

## §E — Code, SEO, infrastructure

### E1. Zero SEO surface for the actual work 🟠

Every project title, blurb, tag and write-up lives in `assets/js/projects.js` and is
injected at runtime. The HTML shipped to a crawler contains none of it.

Google renders JS and will probably index the cards. Bing, LinkedIn's preview
fetcher, Slack unfurls, GPT/Claude crawlers, and most other bots largely will not.
Compounding it: `sitemap.xml` lists **three** URLs, and there is no per-project page,
so "Caleb Lawson wildfire drone swarm" and "CLAW Bench ngspice WASM" have no
canonical destination anywhere on the internet.

The catalog-as-source-of-truth design is the right call and worth keeping. The fix
isn't a framework — it's a ~40-line Node prerender script, run in the existing CI job,
that reads `projects.js` and emits `projects/<id>.html` per project plus updated
sitemap entries. Static output, no build step for you to maintain locally, and it turns
15 invisible projects into 15 indexable pages with their own OG cards.

### E2. No deep links to projects 🟠

Modal state lives in a JS variable. There is no URL for P-01. You **cannot send anyone
a link to a specific project** — every share resolves to the top of the index, and
Back doesn't close the modal, it leaves the page.

That's a daily-use limitation: when a recruiter asks about the swarm work, you should
be able to paste one URL. `history.pushState` with `#p/wildfire-swarm` plus an
`onpopstate` handler and a hash check on boot is ~15 lines and works with the current
architecture. E1's prerendered pages would give you real URLs instead.

### E3. Consistency 🟢

`index.html:158` — the portrait caption reads **"Boston, MA"** while the eyebrow
(`:64`), the meta description (`:7`), the OG description (`:12`), the `PostalAddress`
schema (`:30`) and the Based fact (`:147`) all say **Quincy**. Your README says
"Boston MA" too. Pick one — "Quincy, MA" for the address and "Greater Boston" for
market reach is a defensible split, but the caption directly under your face should
match the address six lines above it.

### E4. Structured data is thinner than it needs to be 🟡

The `Person` block (`index.html:23`) is missing `url`, `email`, `image`, and any
GitHub in `sameAs`. `ProfessionalService` on `services.html` is missing
`areaServed` geo-coordinates, `priceRange`, `telephone` and `sameAs`. No
`ScholarlyArticle` for the IEEE paper (see B3), no `BreadcrumbList`, no
`CreativeWork` per project. For a local consulting practice trying to be found for
"embedded firmware consultant Boston," `priceRange` and a proper `LocalBusiness`
shape are the ones that matter.

### E5. Tests are good; here's where they're blind 🟢

65 assertions across catalog integrity, rendering, filters, modal behaviour,
escaping, both form failure paths, broken-image fallback, reduced motion, mobile nav,
and generated-markup validity. That is a better test suite than most production sites
have, and the "cards are `<article>`, not `<button>`" assertion shows you're testing
the *reason* for a decision, not just its effect.

Not covered: **link integrity** (no test would have caught A3's absolute paths),
**CSS token validity** (nothing caught A4), **contrast** (nothing caught D1), and
**image reachability** (nothing catches a dead Imgur URL). All four are cheap to add
and all four map to a finding in this document. A link-check plus a
`grep var(--x)` ∖ `defined tokens` assertion would have caught two of my five blockers
before I did.

---

## §F — What only you can add

Nothing above requires anything from you but decisions. This section does. Ranked by
return per hour.

### F1. Add the numbers you already have — 2 hours, highest return 🔴

Go through all fifteen `Result` fields and put a measured quantity in each. You ran
these projects; the data exists in your lab notebooks, your MATLAB workspaces and your
capstone report. Specifically:

- **P-08** — the measured settling time vs. the 50 ms spec, and the actual overshoot %. You have the plot in the modal already.
- **P-01** — coverage area, number of aircraft, update rate, flight time, how much faster the containment line refreshed than the baseline. Any one of these.
- **P-06** — which of GREEN/CHROM/POS won, and the BPM error for each under motion.
- **P-09** — the gap range you swept and the thrust you measured, so "no effect" has a bound.
- **P-04** — the ngspice WASM bundle size and cold-start time. "Real SPICE in the browser in X ms" is a headline.
- **P-05** — back-check accuracy against a naive baseline. A model with no reported skill reads as a model with no skill.

### F2. Photograph the hardware — one afternoon 🔴

Nine projects have no photograph. You physically built the ion thruster, the
thermistor thermometer, the lumbar pillow, the lithophane backlight, the DE10-Lite
setup and the laser mic bench. Phone camera, north-facing window, plain background,
three shots each: the whole object, a detail of the interesting part, and the thing
*working* (display lit, scope trace, actuator mid-travel). Keep the generated
schematics as second plates — a photo next to its signal chain is a stronger pair than
either alone.

**P-15 stays redacted.** Standing flag: the provisional clock is running, and outside
the US most jurisdictions apply absolute novelty — one public description can end
foreign filing rights entirely. Do not add photographs, part numbers or architecture
before the non-provisional is filed, and clear any change to that entry with your
patent attorney. Worth confirming the provisional's 12-month date is on a calendar
somewhere you'll see it.

### F3. Publish the code — one evening 🔴

Push CLAW Bench, the MLB pipeline and the FPGA labs to public repos with a real README
each, then add repo links to the site (B2). If a repo isn't presentable, spend the
hour on the README rather than the code — a clear README on rough code reads far
better than a hidden repo.

### F4. Get the paper reachable — one email 🔴

Check your IEEE copyright transfer for the accepted-manuscript posting terms (usually
permitted on a personal site), then drop the PDF in `assets/docs/` and link it. Ask
your co-authors whether Xplore has indexed it yet and get the DOI. Until then, link
the conference programme. This is the highest-credibility item on your site and it
takes one email to unlock.

### F5. Get one piece of consulting proof — the hard one 🟠

The `services.html` gap in B5 is a real business problem and I don't have a clever
answer. The realistic paths, ranked:

1. **Do one small job cheap or free, in exchange for a named testimonial and permission to write it up.** A local contractor's drone survey, a PCB review for someone in your network, a firmware bring-up. One named engagement changes the page more than any redesign.
2. **Anonymise an existing one** if any CLAW work already happened: "A Boston-area contractor needed X; delivered in Y days." Weaker without a name, but far better than nothing.
3. **Convert an internal win into a case study** — with IMEG's permission and no client-identifying detail. Harder, and check before you write.
4. **Publish a productised offer with a fixed price.** "PCB design review — 3 business days — $X, and here's exactly what you get." This substitutes competence signal for social proof and lets people self-qualify. It's the fastest of the four and the only one entirely within your control.

Honest read: without at least one of these, the consulting page will keep converting
only people who already know you. That may be fine — if CLAW is mainly a credential
that makes you a more interesting hire, say so and stop optimising it. But decide
that deliberately rather than by default.

### F6. Decide what the site is for 🟠

The dual-track framing is half-removed (B6). You're a 2026 M.S. graduate with a
full-time job at IMEG, a consulting practice, and a patent-pending product. The site
currently tries to serve all three with one hero and answers none of them clearly.
Pick the primary:

- **Employment-first** → restore the hire panel, change "Available for projects" to name roles explicitly, lift the résumé into the hero, lead with the IEEE paper and the capstone.
- **Consulting-first** → the current shape is right, and F5 becomes the priority.
- **Product-first** → a fourth page once P-15 is filed, and the rest becomes supporting credibility.

This is a strategy call, not a design one, and it's yours. It changes what the hero
says and which section comes second — not the design system, which works for any of
the three.

### F7. Write something 🟡

There is no writing on the site beyond project blurbs. One genuinely technical
post — *"Compiling ngspice to WebAssembly"*, *"Why the swarm search pattern changed
three times"*, *"What ±0.1 °C actually costs on a thermistor"* — would do three things
at once: give the site indexable long-form content (E1), demonstrate the judgment the
four-field modals can't hold (B7), and give you something to link when someone asks
what you're working on. One post is worth more than a blog you'll abandon; don't build
a blog, add a `writing.html` with one article.

---

## Verified vs. unverified

**Verified in this environment:**

- Test suite: `npm test` → **65 passed, 0 failed**. README's "64" is stale.
- `--fs-base` is the only undefined CSS custom property in 1,223 lines (diffed all `var()` uses against all `:root` definitions).
- Dead CSS selectors `.track-hire`, `.hero-role .sep`, `.plot-v` match nothing across all four HTML files and both JS files.
- `localize-images.sh` failure reproduced: `curl` exit **6**, "Could not resolve host: assets".
- Contrast ratios computed from the actual hex tokens using the WCAG 2.x relative-luminance formula (table in D1).
- `og.png` parsed from PNG IHDR: **1200×630**, 37 KB — correct.
- Résumé PDF present: 82 KB, PDF 1.7, `StructTreeRoot` + `Lang(en)` — tagged and accessible.
- 15 distinct `i.imgur.com` URLs across `projects.js` and `index.html`.
- Catalog integrity: 15 projects, `P-01`–`P-15` with no gaps or duplicates, 4 featured (matches "Four worth opening"), all `tracks` values valid against the filter buttons, every project has plates.
- Only P-10's `Result` contains a quantified outcome.
- Zero `github` references in any page or script.
- `404.html` absolute paths, `projects.html` heading structure, missing `noscript`/`theme-color`/`og:image:alt` — all confirmed by grep.
- All nine generated SVGs share `viewBox="0 0 800 500"` (16:10 as documented).

**NOT verified — you need to check these:**

- **Whether the Imgur images still load.** All outbound HTTPS is blocked here (proxy returned 403 for `i.imgur.com` *and* `example.com`), so A2's severity is unknown. Open the live site and look before assuming the worst.
- **Visual rendering.** No browser in this environment. Everything in §C is read from CSS, not seen. The `object-fit: contain` letterboxing in C1 is a strong inference from the rules plus your image mix, not an observation.
- **Résumé contents.** The PDF's text is font-encoded and I couldn't extract it without network access to install a parser, so I could not diff it against the site's claims. Worth checking that dates, titles and the education lines match `index.html` exactly.
- **Formspree endpoint health**, and whether the free-tier submission cap is a risk.
- **Actual crawler behaviour** on the JS-rendered catalog. E1 is based on documented crawler capabilities, not on a Search Console report — check Search Console once the domain is live.
- **Mobile rendering** at real breakpoints, and iOS Safari behaviour for `backdrop-filter` on the masthead and modal.
- **Every claim of fact about your work** — team sizes, dates, what you owned. I audited internal consistency, not truth.

---

## Next step

Spend two hours putting real numbers into all fifteen `Result` fields (F1). It needs
nothing but you and your old lab data, it's the finding that most changes how this site
reads, and once the text is right we do the twenty-minute blocker sweep in §A and push
them together.
