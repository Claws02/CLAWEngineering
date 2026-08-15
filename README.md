# clawengineering.com

Personal site for Caleb Lawson — electrical and embedded systems engineer, Boston MA.
Dual-track: an employment track (home, projects) and a CLAW Engineering consulting track.

Static HTML/CSS/JS. No build step, no framework, no runtime dependencies. Open
`index.html` in a browser and it works.

---

## Files

```
index.html              Home — title sheet, background, experience, featured work, contact
projects.html           Full project index with discipline filters
services.html           CLAW Engineering consulting
404.html                Not-found page
assets/css/site.css     The entire design system
assets/js/projects.js   Project catalog — the only file you edit to add work
assets/js/site.js       All behaviour (nav, reveals, filters, modal, form)
assets/img/             favicon, social card
assets/docs/            résumé PDF goes here
scripts/                One-time maintenance scripts
smoke.test.js           64-assertion test suite
.github/workflows/      CI — runs the suite on every push and PR
robots.txt, sitemap.xml
```

## Adding a project

Edit `assets/js/projects.js` only. Append an object to the array:

```js
{
  id: "unique-slug",
  no: "P-16",
  title: "Thing I Built",
  year: "2026",
  featured: false,                          // true = also shows on the home page
  tracks: ["embedded", "software"],         // electrical | embedded | software | mechanical
  tags: ["ESP32", "C++"],                   // first three show on the card
  blurb: "One or two sentences.",
  image: "assets/img/projects/thing.png",   // optional
  plates: [{ src: "...", cap: "..." }],     // optional detail images
  notes: { Problem: "...", Scope: "...", Role: "...", Result: "..." }
}
```

Both pages render from that array. Nothing else needs touching. `tracks` values must
match the filter buttons in `projects.html` or the project becomes unreachable by filter.

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
- [ ] **Run `bash scripts/localize-images.sh`.** Every project image is currently
      hotlinked from Imgur. Imgur can and does break hotlinks; the script downloads them
      into `assets/img/projects/` and rewrites the references. Commit the result. This has
      to run somewhere with outbound access to `i.imgur.com`.
- [ ] **Move the résumé into the repo.** It is served from a Dropbox share link today.
      Drop the PDF at `assets/docs/caleb-lawson-resume.pdf` and update the link in
      `index.html` (search for `dropbox.com`).
- [ ] **Decide on the public email.** `calebtlawson@gmail.com` appears on the contact page
      and in the form's failure message (`assets/js/site.js`). Swap both for the branded
      address once email routing is up.
- [ ] **Add your B.S. line** to the education row in `index.html` (search for `Education`).
- [ ] **Review project `P-15`** in `assets/js/projects.js` — see the note below.

## Note on P-15

The handheld filtration device is listed with no technical detail: no part numbers, no
architecture, no cartridge or power-system description. That is deliberate. Publishing
specifics before the non-provisional is filed is a public disclosure, and outside the US
most jurisdictions apply absolute novelty — one public description can end foreign filing
rights entirely. The entry as written establishes that the work exists without disclosing
what it is. Do not add detail to it without talking to your patent attorney first, and if
you would rather not signal the product at all, delete the object.

## Verification

`smoke.test.js` covers catalog integrity, rendering, filters, modal behaviour, HTML
validity of generated markup, escaping, the contact form's success and both failure
paths, broken-image fallback, reduced-motion, and the mobile nav.

```
npm install
npm test
```

64 assertions. CI runs them on every push and pull request.
