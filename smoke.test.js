const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = __dirname;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + (extra ? "  -> " + extra : "")); }
};

function load(file, opts = {}) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "https://example.test/" + file + (opts.hash || "")
  });
  const w = dom.window;
  // Environment stubs: jsdom lacks IntersectionObserver and fetch.
  w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
    unobserve() {}
    disconnect() {}
  };
  w.fetch = opts.fetch || (() => Promise.resolve({ ok: true }));
  w.eval(fs.readFileSync(path.join(ROOT, "assets/js/projects.js"), "utf8"));
  if (opts.inject) opts.inject(w);
  w.eval(fs.readFileSync(path.join(ROOT, "assets/js/site.js"), "utf8"));
  return w;
}

// jsdom fires DOMContentLoaded on a later tick, so boot() has not run yet.
const settle = () => new Promise(r => setTimeout(r, 25));
async function loadReady(file, opts) { const w = load(file, opts); await settle(); return w; }

const catalogSrc = fs.readFileSync(path.join(ROOT, "assets/js/projects.js"), "utf8");

/* ---- 1. Catalog integrity ---- */
console.log("\n[1] Catalog integrity");
{
  const sandbox = { window: {} };
  new Function("window", catalogSrc)(sandbox.window);
  const cat = sandbox.window.CLAW_PROJECTS;
  ok("catalog loads", Array.isArray(cat) && cat.length > 0, "len=" + (cat || []).length);
  const ids = cat.map(p => p.id);
  ok("ids unique", new Set(ids).size === ids.length);
  const nos = cat.map(p => p.no);
  ok("sheet numbers unique", new Set(nos).size === nos.length);
  ok("every project has title/blurb/no", cat.every(p => p.title && p.blurb && p.no));
  ok("every project has >=1 track", cat.every(p => (p.tracks || []).length > 0));
  const valid = new Set(["electrical", "embedded", "software", "mechanical"]);
  const badTrack = cat.flatMap(p => (p.tracks || []).filter(t => !valid.has(t)));
  ok("all tracks are known filter values", badTrack.length === 0, badTrack.join(","));
  ok("featured count is 4", cat.filter(p => p.featured).length === 4);
  ok("confidential project leaks no part numbers",
    !/ESP32-C3|BQ21040|MAX17048/i.test(JSON.stringify(cat.find(p => p.id === "confidential-device"))));
}

/* ---- 2. Home page render ---- */
async function homePage() {
  console.log("\n[2] Home page");
  const w = await loadReady("index.html");
  const cards = w.document.querySelectorAll("[data-project]");
  ok("featured grid renders 4 cards", cards.length === 4, "got " + cards.length);
  ok("reveal elements activated", w.document.querySelectorAll(".reveal.is-in").length > 0);
  ok("footer year injected", /^20\d\d$/.test(w.document.querySelector("[data-year]").textContent));
  ok("nav toggle wired", !!w.document.querySelector("[data-nav-toggle]"));
  ok("no card is hidden on home", Array.from(cards).every(c => !c.hidden));
}

/* ---- 3. Projects page: render + filter ---- */
async function filters() {
  console.log("\n[3] Projects page filters");
  const w = await loadReady("projects.html");
  const total = 15;
  ok("full grid renders every project",
    w.document.querySelectorAll("[data-project]").length === total,
    "got " + w.document.querySelectorAll("[data-project]").length);

  const visible = () =>
    Array.from(w.document.querySelectorAll("[data-project]")).filter(c => !c.hidden).length;
  const click = sel => w.document.querySelector(sel).dispatchEvent(
    new w.Event("click", { bubbles: true }));

  ok("all visible by default", visible() === total, "got " + visible());

  for (const track of ["electrical", "embedded", "software", "mechanical"]) {
    click(`[data-filter="${track}"]`);
    const v = visible();
    const correct = Array.from(w.document.querySelectorAll("[data-project]"))
      .every(c => c.hidden !== c.dataset.tracks.split(" ").includes(track));
    ok(`filter "${track}": non-empty and exactly the matching cards`,
      v > 0 && v < total && correct, "visible=" + v);
    ok(`filter "${track}": aria-pressed set on it and cleared elsewhere`,
      w.document.querySelector(`[data-filter="${track}"]`).getAttribute("aria-pressed") === "true" &&
      w.document.querySelector('[data-filter="all"]').getAttribute("aria-pressed") === "false");
  }

  click('[data-filter="all"]');
  ok("returning to All restores every card", visible() === total, "got " + visible());
  ok("count readout populated",
    /sheet/.test(w.document.querySelector("[data-filter-count]").textContent));
}

/* ---- 4. Modal ---- */
async function modal() {
  console.log("\n[4] Modal");
  const w = await loadReady("projects.html");
  const m = w.document.querySelector("[data-modal]");
  const card = w.document.querySelector('[data-project="wildfire-swarm"]');
  const esc = () => w.document.dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  card.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("modal opens", m.classList.contains("is-open"));
  ok("aria-hidden flipped", m.getAttribute("aria-hidden") === "false");
  ok("body scroll locked", w.document.body.style.overflow === "hidden");
  ok("title rendered", /Wildfire/.test(m.textContent));
  ok("notes rendered", /Problem/.test(m.textContent) && /Next pass/.test(m.textContent));
  ok("plates rendered", m.querySelectorAll(".plate").length === 5,
    "got " + m.querySelectorAll(".plate").length);
  ok("images carry no-referrer", Array.from(m.querySelectorAll("img"))
    .every(i => i.getAttribute("referrerpolicy") === "no-referrer"));

  esc();
  ok("escape closes", !m.classList.contains("is-open"));
  ok("body scroll restored", w.document.body.style.overflow === "");

  card.dispatchEvent(new w.Event("click", { bubbles: true }));
  m.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("backdrop click closes", !m.classList.contains("is-open"));

  card.dispatchEvent(new w.Event("click", { bubbles: true }));
  m.querySelector("[data-modal-close]").dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("close button closes", !m.classList.contains("is-open"));

  let threw = null;
  for (const p of w.CLAW_PROJECTS) {
    try {
      w.document.querySelector(`[data-project="${p.id}"]`)
        .dispatchEvent(new w.Event("click", { bubbles: true }));
      if (!m.classList.contains("is-open")) throw new Error("did not open");
      if (!m.textContent.trim()) throw new Error("empty panel");
      esc();
    } catch (e) { threw = p.id + ": " + e.message; break; }
  }
  ok("all 15 projects open and render without error", threw === null, threw);
}

/* ---- 5. Escaping ---- */
async function escaping() {
  console.log("\n[5] Escaping");
  const w = await loadReady("projects.html", {
    inject: win => {
      win.CLAW_PROJECTS.push({
        id: "xss", no: "X-01", year: "2026",
        title: '<img src=x onerror="window.PWNED=1">',
        blurb: '</button><script>window.PWNED=2<\/script>',
        tracks: ["software"], tags: ['<b onmouseover="window.PWNED=3">t</b>'],
        notes: { A: '<script>window.PWNED=4<\/script>' }
      });
    }
  });
  ok("malicious entry did render", w.document.querySelectorAll("[data-project]").length === 16,
    "got " + w.document.querySelectorAll("[data-project]").length);
  ok("no script executed from card render", w.PWNED === undefined, "PWNED=" + w.PWNED);
  w.document.querySelector('[data-project="xss"]')
    .dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("no script executed from modal render", w.PWNED === undefined, "PWNED=" + w.PWNED);
  ok("title shown as literal text",
    /<img src=x/.test(w.document.querySelector("[data-modal]").textContent));
}

/* ---- 6. Contact form: success ---- */
async function formSuccess() {
  console.log("\n[6] Form — success path");
  let sent = null;
  const w = await loadReady("index.html", {
    fetch: (url, opts) => { sent = { url, opts }; return Promise.resolve({ ok: true }); }
  });
  const form = w.document.querySelector("[data-form]");
  form.querySelector("#name").value = "Test Person";
  form.querySelector("#email").value = "test@example.com";
  form.querySelector("#message").value = "Hello";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await settle();
  ok("posts to formspree", sent && /formspree\.io/.test(sent.url), sent && sent.url);
  ok("uses POST", sent && sent.opts.method === "POST");
  const status = form.querySelector("[data-form-status]");
  ok("success message shown", status.classList.contains("is-ok"), status.textContent);
  ok("form cleared after send", form.querySelector("#name").value === "");
  ok("button re-enabled", !form.querySelector("button[type=submit]").disabled);
}


/* ---- 12. HTML validity of generated cards ---- */
async function cardValidity() {
  console.log("\n[12] Generated markup validity");
  const w = await loadReady("projects.html");
  const cards = w.document.querySelectorAll("[data-project]");
  ok("cards are <article>, not <button>",
    Array.from(cards).every(c => c.tagName === "ARTICLE"));
  ok("no heading nested inside a button",
    w.document.querySelectorAll("button h1, button h2, button h3, button h4").length === 0);
  ok("each card has exactly one h3",
    Array.from(cards).every(c => c.querySelectorAll("h3").length === 1));
  ok("each card has a labelled action button",
    Array.from(cards).every(c => {
      const b = c.querySelector("button.card-more");
      return b && /Open sheet for .+/.test(b.textContent.replace(/\s+/g, " "));
    }));
  ok("clicking the inner button still opens the modal", (() => {
    const m = w.document.querySelector("[data-modal]");
    cards[0].querySelector("button.card-more")
      .dispatchEvent(new w.Event("click", { bubbles: true }));
    return m.classList.contains("is-open");
  })());
  ok("figures without images start in placeholder state",
    Array.from(w.document.querySelectorAll(".card-figure"))
      .every(f => f.querySelector("img") || f.classList.contains("is-broken")));
}

/* ---- 7. Contact form: failure path ---- */
async function failurePath() {
  console.log("\n[7] Form — failure path");
  const w = await loadReady("index.html", { fetch: () => Promise.reject(new Error("network down")) });
  const form = w.document.querySelector("[data-form]");
  form.querySelector("#name").value = "Test Person";
  form.querySelector("#email").value = "test@example.com";
  form.querySelector("#message").value = "Hello";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 30));
  const status = form.querySelector("[data-form-status]");
  ok("failure message shown", status.classList.contains("is-bad"), status.textContent);
  ok("failure message gives a fallback route", /calebtlawson@gmail\.com/.test(status.textContent));
  ok("button restored after failure", !form.querySelector("button[type=submit]").disabled);
  ok("button label restored", form.querySelector("button[type=submit]").textContent === "Send message");
}

/* ---- 8. Form: server rejects (non-ok response) ---- */
async function serverReject() {
  console.log("\n[8] Form — server 4xx");
  const w = await loadReady("index.html", { fetch: () => Promise.resolve({ ok: false, status: 422 }) });
  const form = w.document.querySelector("[data-form]");
  form.querySelector("#name").value = "A";
  form.querySelector("#email").value = "a@b.co";
  form.querySelector("#message").value = "m";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 30));
  ok("4xx treated as failure, not success",
    form.querySelector("[data-form-status]").classList.contains("is-bad"));
}

/* ---- 9. Broken image fallback ---- */
async function brokenImage() {
  console.log("\n[9] Broken image fallback");
  const w = await loadReady("projects.html");
  const img = w.document.querySelector(".card-figure img");
  img.dispatchEvent(new w.Event("error", { bubbles: false }));
  ok("figure marked broken so placeholder shows",
    img.closest(".card-figure").classList.contains("is-broken"));
  // Every catalogued project currently ships a plate, so the up-front
  // placeholder path is exercised with a synthetic entry rather than by
  // relying on the catalog having a gap in it.
  const w2 = await loadReady("projects.html", {
    inject: win => win.CLAW_PROJECTS.push({
      id: "no-plate", no: "Z-01", year: "2026", title: "No plate",
      blurb: "Entry with no image.", tracks: ["software"], tags: [], notes: {}
    })
  });
  const noImage = Array.from(w2.document.querySelectorAll(".card-figure"))
    .filter(f => !f.querySelector("img"));
  ok("image-less projects render placeholder up front", noImage.length > 0 &&
    noImage.every(f => f.classList.contains("is-broken")), "count=" + noImage.length);

  // And the real catalog should not be quietly losing plates.
  const withImg = Array.from(w.document.querySelectorAll(".card-figure"))
    .filter(f => f.querySelector("img"));
  ok("every catalogued project ships a plate",
    withImg.length === w.document.querySelectorAll("[data-project]").length,
    withImg.length + "/" + w.document.querySelectorAll("[data-project]").length);
}

/* ---- 10. Reduced motion ---- */
async function reducedMotion() {
  console.log("\n[10] Reduced motion");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.test/" });
  const w = dom.window;
  w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {} });
  // No IntersectionObserver at all — reveal must still resolve.
  delete w.IntersectionObserver;
  w.fetch = () => Promise.resolve({ ok: true });
  w.eval(fs.readFileSync(path.join(ROOT, "assets/js/projects.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(ROOT, "assets/js/site.js"), "utf8"));
  await settle();
  const hidden = Array.from(w.document.querySelectorAll(".reveal"))
    .filter(e => !e.classList.contains("is-in"));
  ok("all content visible with reduced motion + no IntersectionObserver",
    hidden.length === 0, hidden.length + " still hidden");
}

/* ---- 11. Nav toggle ---- */
async function navToggle() {
  console.log("\n[11] Mobile nav");
  const w = await loadReady("index.html");
  const btn = w.document.querySelector("[data-nav-toggle]");
  const nav = w.document.querySelector("[data-nav]");
  btn.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("opens", nav.classList.contains("is-open") && btn.getAttribute("aria-expanded") === "true");
  ok("label flips to Close", btn.textContent === "Close");
  w.document.querySelector(".nav-link").dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("closes after choosing a link", !nav.classList.contains("is-open"));
  ok("label restored", btn.textContent === "Menu");
}

/* ---- 13. Deep links: the hash is the source of truth ---- */
async function deepLinks() {
  console.log("\n[13] Deep links");
  const w = await loadReady("projects.html");
  const m = w.document.querySelector("[data-modal]");
  const card = w.document.querySelector('[data-project="fpga-display"]');

  card.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("opening a sheet writes #p/<id>", w.location.hash === "#p/fpga-display", w.location.hash);
  ok("sheet links to its standalone page",
    m.querySelector(".modal-link") && m.querySelector(".modal-link").getAttribute("href") === "projects/fpga-display.html");

  m.querySelector("[data-modal-close]").dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("close hides immediately", !m.classList.contains("is-open"));
  await settle();
  ok("close steps history back, clearing the hash", w.location.hash === "", w.location.hash);

  card.dispatchEvent(new w.Event("click", { bubbles: true }));
  w.history.back();
  await settle();
  ok("browser Back closes the sheet", !m.classList.contains("is-open") && w.location.hash === "");

  const d = await loadReady("projects.html", { hash: "#p/wildfire-swarm" });
  const dm = d.document.querySelector("[data-modal]");
  ok("landing on #p/<id> opens that sheet", dm.classList.contains("is-open") && /Wildfire/.test(dm.textContent));
  d.document.dispatchEvent(new d.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok("closing a landed sheet strips the hash without leaving the page",
    !dm.classList.contains("is-open") && d.location.hash === "" && /projects\.html$/.test(d.location.pathname));

  const h = await loadReady("index.html", { hash: "#p/claw-bench" });
  ok("deep links also work on the home page", h.document.querySelector("[data-modal]").classList.contains("is-open"));

  const bad = await loadReady("projects.html", { hash: "#p/not-a-project" });
  ok("unknown id is ignored", !bad.document.querySelector("[data-modal]").classList.contains("is-open"));
  const anchor = await loadReady("index.html", { hash: "#contact" });
  ok("ordinary anchors are not mistaken for sheets", !anchor.document.querySelector("[data-modal]").classList.contains("is-open"));
}

/* ---- 14. Focus containment ---- */
async function focusContainment() {
  console.log("\n[14] Focus containment");
  const w = await loadReady("projects.html");
  const main = w.document.querySelector("main");
  const head = w.document.querySelector(".masthead");
  const btn = w.document.querySelector('[data-project="rppg"] .card-more');
  btn.focus();
  btn.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("page behind the sheet goes inert", main.hasAttribute("inert") && head.hasAttribute("inert"));
  ok("dialog itself stays interactive", !w.document.querySelector("[data-modal]").closest("[inert]"));
  ok("focus moves to Close", w.document.activeElement === w.document.querySelector("[data-modal-close]"));
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok("inert lifted on close", !main.hasAttribute("inert") && !head.hasAttribute("inert"));
  ok("focus returns to the card that opened it", w.document.activeElement === btn);
}

/* ---- 15. Plates and photo fit ---- */
async function platesAndFit() {
  console.log("\n[15] Plates and photo fit");
  const w = await loadReady("projects.html", {
    inject: win => win.CLAW_PROJECTS.push({
      id: "photo", no: "Z-02", year: "2026", title: "Photo", blurb: "b", tracks: ["software"],
      tags: [], notes: {}, image: "assets/img/og.png", fit: "cover"
    })
  });
  const m = w.document.querySelector("[data-modal]");
  w.document.querySelector('[data-project="wildfire-swarm"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  const links = m.querySelectorAll(".plate-link");
  ok("every plate opens full size", links.length === 5 &&
    Array.from(links).every(a => a.getAttribute("href") === a.querySelector("img").getAttribute("src") && a.target === "_blank"));
  ok("multi-plate sets use the grid", !m.querySelector(".plates").classList.contains("is-single"));
  m.querySelector("[data-modal-close]").dispatchEvent(new w.Event("click", { bubbles: true }));
  w.document.querySelector('[data-project="laser-mic"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("a lone plate spans the full width", m.querySelector(".plates").classList.contains("is-single"));
  ok("fit: cover marks the card as a photo",
    w.document.querySelector('[data-project="photo"] .card-figure').classList.contains("is-photo"));
  ok("drawings keep the contained treatment",
    !w.document.querySelector('[data-project="claw-bench"] .card-figure').classList.contains("is-photo"));
}

/* ---- 16. Sort ---- */
async function sorting() {
  console.log("\n[16] Sort");
  const w = await loadReady("projects.html");
  const years = () => Array.from(w.document.querySelectorAll('[data-grid="all"] [data-project]'))
    .filter(c => !c.hidden).map(c => +c.getAttribute("data-sort-year"));
  const sorted = (a, dir) => a.every((y, i) => i === 0 || (dir < 0 ? a[i - 1] >= y : a[i - 1] <= y));
  ok("newest first by default", sorted(years(), -1), years().join(" "));
  w.document.querySelector('[data-sort="oldest"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("oldest first on request", sorted(years(), 1), years().join(" "));
  ok("sort buttons report state", w.document.querySelector('[data-sort="oldest"]').getAttribute("aria-pressed") === "true" &&
    w.document.querySelector('[data-sort="newest"]').getAttribute("aria-pressed") === "false");
  w.document.querySelector('[data-filter="embedded"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  ok("filter still applies after sorting", years().length > 0 && sorted(years(), 1) &&
    Array.from(w.document.querySelectorAll('[data-project]')).filter(c => !c.hidden)
      .every(c => c.getAttribute("data-tracks").split(" ").includes("embedded")));
  ok("card text survives the footer-year hook", /Wildfire/.test(w.document.querySelector('[data-project="wildfire-swarm"]').textContent));
  ok("filter count is announced", w.document.querySelector("[data-filter-count]").getAttribute("aria-live") === "polite");
}

/* ---- 17. Hero, services and generated pages ---- */
async function heroAndPages() {
  console.log("\n[17] Hero, services and generated pages");
  const w = await loadReady("index.html");
  const tracks = w.document.querySelectorAll(".tracks .track");
  ok("hero offers both tracks", tracks.length === 2 &&
    w.document.querySelector(".track-hire") && w.document.querySelector(".track-claw"));
  ok("résumé is reachable from the hero",
    w.document.querySelector('.hero a[href="assets/docs/caleb-lawson-resume.pdf"]') !== null);
  ok("both forms carry the honeypot", ["index.html", "services.html"].every(f =>
    /name="_gotcha"/.test(fs.readFileSync(path.join(ROOT, f), "utf8"))));

  const s = await loadReady("services.html");
  ok("services page boots without the catalog", s.document.querySelector("[data-form]") && !/projects\.js/.test(
    fs.readFileSync(path.join(ROOT, "services.html"), "utf8")));

  const { build } = require("./scripts/build-project-pages.js");
  const files = build();
  const stale = Object.keys(files).filter(rel => {
    const abs = path.join(ROOT, rel);
    return !fs.existsSync(abs) || fs.readFileSync(abs, "utf8") !== files[rel];
  });
  ok("generated pages match the catalog (run npm run build)", stale.length === 0, stale.join(", "));

  const p = await loadReady("projects/velocity-controller.html");
  ok("standalone page has the content without the catalog script",
    /DC Motor Velocity Controller/.test(p.document.querySelector("h1").textContent) &&
    p.document.querySelectorAll(".note").length === 5 && p.document.querySelectorAll(".plate").length === 2);
  ok("standalone page has its own canonical URL",
    p.document.querySelector('link[rel="canonical"]').href === "https://clawengineering.com/projects/velocity-controller.html");
}

/* ---- 18. Static checks: tokens, contrast, links ---- */
function staticChecks() {
  console.log("\n[18] Static checks");
  const css = fs.readFileSync(path.join(ROOT, "assets/css/site.css"), "utf8");
  const defined = new Set((css.match(/--[a-z0-9-]+(?=\s*:)/g) || []));
  const used = new Set((css.match(/var\((--[a-z0-9-]+)/g) || []).map(v => v.slice(4)));
  const undef = [...used].filter(v => !defined.has(v));
  ok("every CSS custom property used is defined", undef.length === 0, undef.join(", "));

  const tok = n => (css.match(new RegExp("--" + n + ":\\s*(#[0-9a-f]{6})", "i")) || [])[1];
  const lum = hex => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // Text token on the grounds it actually sits on. graphite-2 never sits on
  // paper-3; the two labels that do use graphite instead.
  const pairs = [["ink", "paper"], ["graphite", "paper"], ["graphite", "paper-3"],
    ["graphite-2", "paper"], ["graphite-2", "paper-2"], ["blue", "paper"], ["blue", "blue-wash"],
    ["redline", "paper"], ["redline", "paper-3"], ["redline", "redline-wash"]];
  const low = pairs.map(([f, b]) => [f, b, ratio(tok(f), tok(b))]).filter(r => r[2] < 4.5);
  ok("text tokens meet WCAG AA (4.5:1) on their grounds", low.length === 0,
    low.map(r => r[0] + "/" + r[1] + "=" + r[2].toFixed(2)).join(", "));

  const pages = ["index.html", "projects.html", "services.html", "404.html"]
    .concat(fs.readdirSync(path.join(ROOT, "projects")).map(f => "projects/" + f));
  const broken = [];
  pages.forEach(rel => {
    const html = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const ids = new Set((html.match(/\sid="([^"]+)"/g) || []).map(m => m.slice(5, -1)));
    (html.match(/\s(?:href|src)="([^"]+)"/g) || []).forEach(m => {
      const ref = m.replace(/^\s(?:href|src)="/, "").slice(0, -1);
      if (/^(https?:|mailto:|data:)/.test(ref)) return;
      if (ref.startsWith("#")) {
        if (ref.length > 1 && !ids.has(ref.slice(1))) broken.push(rel + " -> " + ref);
        return;
      }
      const file = ref.split(/[?#]/)[0];
      if (file.startsWith("/")) { broken.push(rel + " -> " + ref + " (root-absolute)"); return; }
      if (!fs.existsSync(path.join(ROOT, path.dirname(rel), file))) broken.push(rel + " -> " + ref);
    });
  });
  ok("every local link and asset resolves (" + pages.length + " pages)", broken.length === 0, broken.join("; "));

  global.window = {};
  require("./assets/js/projects.js");
  const missing = [];
  window.CLAW_PROJECTS.forEach(p => [p.image].concat((p.plates || []).map(pl => pl.src)).forEach(src => {
    if (src && !/^https?:/.test(src) && !fs.existsSync(path.join(ROOT, src))) missing.push(p.no + ": " + src);
  }));
  ok("every local catalog image exists", missing.length === 0, missing.join(", "));
  const remote = window.CLAW_PROJECTS.filter(p => /^https?:/.test(p.image || "")).map(p => p.no);
  if (remote.length) console.log("  NOTE  still hotlinked, run scripts/localize-images.sh: " + remote.join(" "));
}

(async () => {
  await homePage();
  await filters();
  await modal();
  await escaping();
  await formSuccess();
  await failurePath();
  await serverReject();
  await brokenImage();
  await reducedMotion();
  await navToggle();
  await cardValidity();
  await deepLinks();
  await focusContainment();
  await platesAndFit();
  await sorting();
  await heroAndPages();
  staticChecks();
  console.log("\n========================================");
  console.log("  " + pass + " passed, " + fail + " failed");
  console.log("========================================");
  process.exit(fail ? 1 : 0);
})();
