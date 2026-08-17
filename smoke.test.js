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
    url: "https://example.test/" + file
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
  console.log("\n========================================");
  console.log("  " + pass + " passed, " + fail + " failed");
  console.log("========================================");
  process.exit(fail ? 1 : 0);
})();
