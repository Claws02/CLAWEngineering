# clawengineering.com

Personal site for Caleb Lawson — electrical and embedded systems engineer, Quincy, MA.
Dual-track: an employment track (home, projects) and a CLAW Engineering consulting track.

Static HTML/CSS/JS. No build step, no framework, no runtime dependencies. Open
`index.html` in a browser and it works.

---

## Files

```
index.html              Home — title sheet, background, experience, featured work, contact
projects.html           Full project index with discipline filters and sort
projects/<id>.html      One standalone page per project — GENERATED, do not edit
services.html           CLAW Engineering consulting
404.html                Not-found page
assets/css/site.css     The entire design system
assets/js/projects.js   Project catalog — the only file you edit to add work
assets/js/site.js       All behaviour (nav, reveals, filters, modal, form)
assets/img/             favicon, social card
assets/img/projects/    Project plates — generated schematics + downloaded photos
assets/docs/            résumé PDF
scripts/                Maintenance and asset-generation scripts (og-card.html → og.png)
code/<project>/         Published project source, linked from the project's sheet
docs/                   Audit reports
smoke.test.js           Test suite
.github/workflows/      CI — runs the suite on every push and PR
robots.txt
sitemap.xml             GENERATED with the project pages
```

## Adding a project

Edit `assets/js/projects.js` only. Append an object to the array:

```js
{
  id: "unique-slug",
  no: "P-14",
  title: "Thing I Built",
  year: "2026",
  featured: false,                          // true = also shows on the home page
  tracks: ["embedded", "software"],         // electrical | embedded | software | mechanical
  tags: ["ESP32", "C++"],                   // first three show on the card
  blurb: "One or two sentences.",
  image: "assets/img/projects/thing.png",   // optional
  fit: "cover",                             // optional — photographs only, see below
  plates: [{ src: "...", cap: "..." }],     // optional detail images
  notes: { Problem: "...", Scope: "...", Role: "...", Result: "..." }
}
```

Then regenerate the standalone pages and sitemap:

```
npm run build
```

The home page and project index render from the array directly; `projects/<id>.html` and
`sitemap.xml` are generated from it so every project has a real, crawlable URL. `npm test`
fails if you edit the catalog and forget the build. `tracks` values must match the filter
buttons in `projects.html` or the project becomes unreachable by filter.

**`fit: "cover"`** makes a card image fill its frame instead of sitting inside a margin.
Use it for photographs. Leave it off for diagrams, renders and screenshots — cropping a
Simulink model to fill a box is worse than a margin around it.

**Linking to a project.** Every sheet has two addresses: `projects.html#p/<id>` opens the
sheet over the index (Back closes it), and `projects/<id>.html` is the standalone page —
use that one when you paste a link to someone, since it carries its own preview card.

### Project plates

Projects without a photograph use a generated schematic plate — a line drawing of the
actual mechanism (signal chain, waveform, optical path) in the site palette, sized 16:10
to match the card figure. They live in `assets/img/projects/*.svg` and are produced by:

```
python3 scripts/make-placeholders.py
```

Edit the drawing functions in that script and re-run to change one. **These are stand-ins
for real photographs** — when you have a photo of the built thing, drop it in
`assets/img/projects/` and change the `image` path in the catalog. A photo of hardware
that exists always beats a diagram of it.

---

## Deploying

All internal links are relative, so the site runs from any host with no edits. Only the
canonical, Open Graph and sitemap URLs are absolute — they currently point at
`https://clawengineering.com`, which is **not live yet**. See the checklist below.

### Recommended: Cloudflare Pages + clawengineering.com

1. Buy `clawengineering.com` at **Cloudflare Registrar** — sold at cost, roughly $10–11/yr,
   no first-year-cheap/renewal-expensive trick, free WHOIS privacy.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `Claws02/CLAWEngineering`.
3. Build settings: **framework preset `None`**, **build command empty**,
   **output directory `/`**. There is no build step.
4. **Custom domains** → add `clawengineering.com` and `www.clawengineering.com`.
   TLS is automatic.
5. **Email Routing** (free) → forward `caleb@clawengineering.com` to your Gmail, and
   enable "Send as" in Gmail so replies come from the branded address.

Every push to `main` deploys. Every pull request gets its own preview URL. Rollback is
one click. Cloudflare Pages ignores a `CNAME` file — the domain is configured in the
dashboard, not in the repo.

### Fallback: GitHub Pages

Serves from `https://claws02.github.io/CLAWEngineering/` with this repo name. `.nojekyll`
is committed so the files are served verbatim.

To use the custom domain on Pages instead of Cloudflare, add a `CNAME` file at the repo
root containing `clawengineering.com` — but **only after the domain is registered and its
DNS points at GitHub**. Adding it earlier takes the working `claws02.github.io` URL out of
service and serves nothing in its place.

---

## Before you go live

- [ ] **Register `clawengineering.com`** and point it at whichever host you pick. Until
      then the canonical and `og:url` tags in `index.html`, `projects.html`,
      `services.html`, `robots.txt` and `sitemap.xml` reference a domain that does not
      resolve. If you decide on a different URL, search and replace
      `https://clawengineering.com` across those five files.
- [ ] **Replace the generated plates with real photographs** as you get them. See
      "Project plates" above.
- [ ] **Decide on the public email.** `calebtlawson@gmail.com` appears on the contact page
      and in the form's failure message (`assets/js/site.js`). Swap both for the branded
      address once email routing is up.
- [ ] **Link the IEEE paper** — the DOI, and optionally the *accepted manuscript*
      (post-review, pre-IEEE-formatting) with IEEE's copyright notice and the DOI on it.
      Never the IEEE-formatted PDF from Xplore. The slot is commented out in
      `index.html` (search for `IEEE posting policy`).
- [ ] **Source code** — each `code/<project>/` folder is linked from its sheet via the
      catalog's `code` field. Links point at `main`, so they resolve once this merges.
      No licence is set, so the code is viewable but not reusable; add a `LICENSE` if
      you want otherwise.

## Verification

`smoke.test.js` covers catalog integrity, rendering, filters, modal behaviour, HTML
validity of generated markup, escaping, the contact form's success and both failure
paths, broken-image fallback, reduced-motion, and the mobile nav.

```
npm install
npm test
```

Beyond the behaviour above it also checks deep links, focus containment while a sheet is
open, sorting, plates, that the generated pages match the catalog, that every CSS custom
property used is defined, that text tokens meet WCAG AA contrast on their backgrounds,
and that every local link and asset on every page resolves. CI runs it on every push and
pull request.
