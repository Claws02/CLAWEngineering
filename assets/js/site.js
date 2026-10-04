/* ============================================================
   Site behaviour. No frameworks, no CDN dependencies.
   Every block is feature-detected, so this one file is safe
   to load on every page.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest(".nav-link") && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    Array.prototype.forEach.call(items, function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + "ms";
      io.observe(el);
    });
  }

  /* ---------- Image fallback ----------
     Thumbnails are hosted off-site today. If one fails to load
     we swap in a hatched placeholder instead of a broken icon. */
  function guardImage(img) {
    img.addEventListener("error", function () {
      var fig = img.closest(".card-figure") || img.parentElement;
      if (fig) fig.classList.add("is-broken");
    });
    if (img.complete && img.naturalWidth === 0) {
      var fig = img.closest(".card-figure") || img.parentElement;
      if (fig) fig.classList.add("is-broken");
    }
  }

  /* ---------- Project rendering ---------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardMarkup(p) {
    var tags = (p.tags || [])
      .slice(0, 3)
      .map(function (t) {
        return '<span class="tag">' + escapeHtml(t) + "</span>";
      })
      .join("");

    var figure = p.image
      ? '<div class="card-figure' + (p.fit === "cover" ? " is-photo" : "") + '">' +
        '<img src="' +
        escapeHtml(p.image) +
        '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
        '<span class="fallback">' +
        escapeHtml(p.no) +
        "</span></div>"
      : '<div class="card-figure is-broken">' +
        '<span class="fallback">' +
        escapeHtml(p.no) +
        "</span></div>";

    /* An <article> wrapper, not a <button>: headings are not valid inside a
       button. The whole card is still clickable via the delegated handler,
       and the inner button gives keyboard users a real, labelled target. */
    return (
      '<article class="card reveal" data-project="' +
      escapeHtml(p.id) +
      '" data-tracks="' +
      escapeHtml((p.tracks || []).join(" ")) +
      '" data-sort-year="' +
      escapeHtml(p.year || "") +
      '">' +
      figure +
      '<div class="card-body">' +
      '<div class="card-no">' +
      escapeHtml(p.no) +
      " &nbsp;/&nbsp; " +
      escapeHtml(p.year || "") +
      "</div>" +
      '<h3 class="card-title">' +
      escapeHtml(p.title) +
      "</h3>" +
      '<p class="card-desc">' +
      escapeHtml(p.blurb) +
      "</p>" +
      '<div class="card-tags">' +
      tags +
      "</div>" +
      '<button class="card-more" type="button">Open sheet' +
      '<span class="visually-hidden"> for ' +
      escapeHtml(p.title) +
      "</span> &rarr;</button>" +
      "</div></article>"
    );
  }

  function initGrids(catalog) {
    var grids = document.querySelectorAll("[data-grid]");
    if (!grids.length) return;

    Array.prototype.forEach.call(grids, function (grid) {
      var set =
        grid.getAttribute("data-grid") === "featured"
          ? catalog.filter(function (p) {
              return p.featured;
            })
          : catalog;

      grid.innerHTML = set.map(cardMarkup).join("");
      Array.prototype.forEach.call(grid.querySelectorAll("img"), guardImage);
    });
  }

  function initFilters() {
    var buttons = document.querySelectorAll("[data-filter]");
    if (!buttons.length) return;

    var count = document.querySelector("[data-filter-count]");

    function apply(value) {
      var cards = document.querySelectorAll("[data-project]");
      var shown = 0;

      Array.prototype.forEach.call(cards, function (card) {
        var tracks = (card.getAttribute("data-tracks") || "").split(" ");
        var match = value === "all" || tracks.indexOf(value) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });

      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute(
          "aria-pressed",
          b.getAttribute("data-filter") === value ? "true" : "false"
        );
      });

      if (count) {
        count.textContent =
          shown + (shown === 1 ? " sheet" : " sheets") + (value === "all" ? "" : " · " + value);
      }
    }

    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-filter"));
      });
    });

    apply("all");
  }

  /* ---------- Sort (project index) ----------
     Newest first by default; ties keep catalog order so the result is stable. */
  function initSort() {
    var buttons = document.querySelectorAll("[data-sort]");
    var grid = document.querySelector('[data-grid="all"]');
    if (!buttons.length || !grid) return;

    function apply(order) {
      var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-project]"));
      cards.forEach(function (c, i) {
        if (!c.hasAttribute("data-index")) c.setAttribute("data-index", i);
      });
      cards.sort(function (a, b) {
        var ya = +a.getAttribute("data-sort-year") || 0;
        var yb = +b.getAttribute("data-sort-year") || 0;
        var ia = +a.getAttribute("data-index");
        var ib = +b.getAttribute("data-index");
        if (ya !== yb) return order === "oldest" ? ya - yb : yb - ya;
        return ia - ib;
      });
      cards.forEach(function (c) {
        grid.appendChild(c);
      });
      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-sort") === order ? "true" : "false");
      });
    }

    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-sort"));
      });
    });

    apply("newest");
  }

  /* ---------- Detail modal ----------
     The URL hash is the source of truth: a sheet is open exactly when the
     hash reads #p/<id>. That makes every sheet linkable, and Back closes it.

       state     input                     result
       closed    card click                push #p/id, show
       closed    load / popstate #p/id     show (no push)
       closed    Esc, close, backdrop      ignored
       open A    Esc, close, backdrop      hide; back() if we pushed, else strip hash
       open A    popstate without #p/      hide
       open A    popstate #p/B             show B
       any       #p/<unknown id>           treated as no sheet                   */
  var SHEET_HASH = /^#p\/([a-z0-9-]+)$/;

  /* Plates are a mix of wide charts, tall schematics and ordinary figures.
     A single cell shape letterboxes the first two into slivers, so classify
     each one by its real proportions once it has loaded. */
  function fitPlates(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".plate-img"), function (img) {
      function classify() {
        var fig = img.closest(".plate");
        if (!fig || !img.naturalWidth || !img.naturalHeight) return;
        var r = img.naturalWidth / img.naturalHeight;
        fig.classList.toggle("is-wide", r >= 1.9);
        fig.classList.toggle("is-tall", r <= 0.7);
      }
      if (img.complete) classify();
      else img.addEventListener("load", classify);
    });
  }

  function initModal(catalog) {
    var modal = document.querySelector("[data-modal]");
    if (!modal) return;

    var panel = modal.querySelector("[data-modal-content]");
    var lastFocus = null;
    var openId = null;

    function find(id) {
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].id === id) return catalog[i];
      }
      return null;
    }

    function hashId() {
      var m = SHEET_HASH.exec(window.location.hash || "");
      return m && find(m[1]) ? m[1] : null;
    }

    /* Everything outside the dialog goes inert while it is open, so Tab
       cannot walk into the page hidden behind it. */
    function setInert(on) {
      Array.prototype.forEach.call(
        document.querySelectorAll("body > header, body > main, body > footer, body > .skip-link"),
        function (el) {
          if (on) el.setAttribute("inert", "");
          else el.removeAttribute("inert");
        }
      );
    }

    function render(p) {
      var plateList = p.plates || [];
      var plates = plateList
        .map(function (pl) {
          return (
            '<figure class="plate">' +
            '<a class="plate-link" href="' +
            escapeHtml(pl.src) +
            '" target="_blank" rel="noopener">' +
            '<img class="plate-img" src="' +
            escapeHtml(pl.src) +
            '" alt="' +
            escapeHtml(pl.cap || "") +
            '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
            '<span class="plate-zoom" aria-hidden="true">Full size &#8599;</span>' +
            '<span class="visually-hidden"> (opens full size in a new tab)</span>' +
            "</a>" +
            '<figcaption class="plate-cap">' +
            escapeHtml(pl.cap || "") +
            "</figcaption></figure>"
          );
        })
        .join("");

      var notes = Object.keys(p.notes || {})
        .map(function (k) {
          return (
            '<div class="note"><dt>' +
            escapeHtml(k) +
            "</dt><dd>" +
            escapeHtml(p.notes[k]) +
            "</dd></div>"
          );
        })
        .join("");

      var tags = (p.tags || [])
        .map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + "</span>";
        })
        .join("");

      panel.innerHTML =
        '<div class="modal-bar">' +
        '<span class="modal-bar-no">' +
        escapeHtml(p.no) +
        " &nbsp;/&nbsp; " +
        escapeHtml(p.year || "") +
        " &nbsp;/&nbsp; " +
        escapeHtml((p.tracks || []).join(", ")) +
        "</span>" +
        '<div class="modal-actions">' +
        '<a class="modal-link" href="projects/' +
        escapeHtml(p.id) +
        '.html">Open as page</a>' +
        '<button class="modal-close" type="button" data-modal-close>Close</button>' +
        "</div>" +
        "</div>" +
        '<div class="modal-body">' +
        '<h2 class="modal-title" id="modal-title">' +
        escapeHtml(p.title) +
        "</h2>" +
        (tags ? '<div class="card-tags" style="margin-bottom:1.75rem">' + tags + "</div>" : "") +
        (plates
          ? '<div class="plates' + (plateList.length === 1 ? " is-single" : "") + '">' + plates + "</div>"
          : "") +
        '<dl class="notes">' +
        notes +
        "</dl>" +
        (/^https:\/\//.test(p.code || "")
          ? '<p class="sheet-actions"><a class="btn btn-ghost" href="' +
            escapeHtml(p.code) +
            '" target="_blank" rel="noopener">Source code <span aria-hidden="true">&rarr;</span></a></p>'
          : "") +
        "</div>";

      Array.prototype.forEach.call(panel.querySelectorAll("img"), function (img) {
        img.addEventListener("error", function () {
          var fig = img.closest(".plate");
          if (fig) fig.remove();
        });
      });
      fitPlates(panel);
    }

    function show(id) {
      var p = find(id);
      if (!p || openId === id) return;
      if (!openId) lastFocus = document.activeElement;

      render(p);
      openId = id;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      modal.scrollTop = 0;
      document.body.style.overflow = "hidden";
      setInert(true);

      var closeBtn = panel.querySelector("[data-modal-close]");
      if (closeBtn) closeBtn.focus();
    }

    function hide() {
      if (!openId) return;
      openId = null;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      setInert(false);
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
      lastFocus = null;
    }

    function requestOpen(id) {
      if (!find(id)) return;
      if (window.history && window.history.pushState) {
        window.history.pushState({ clawSheet: id }, "", "#p/" + id);
      }
      show(id);
    }

    function requestClose() {
      if (!openId) return;
      var st = window.history && window.history.state;
      if (st && st.clawSheet) {
        // We pushed this entry, so Back is the honest close: the hash and the
        // history agree afterwards. Hide now rather than waiting on the
        // traversal; the popstate that follows finds nothing open.
        hide();
        window.history.back();
        return;
      }
      // Landed directly on #p/<id>: strip the hash without leaving the page.
      if (hashId() && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      hide();
    }

    function syncToHash() {
      var id = hashId();
      if (id) show(id);
      else hide();
    }

    document.addEventListener("click", function (e) {
      if (openId) {
        if (e.target.closest("[data-modal-close]") || e.target === modal) requestClose();
        return;
      }
      var trigger = e.target.closest("[data-project]");
      if (trigger) requestOpen(trigger.getAttribute("data-project"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && openId) requestClose();
    });

    window.addEventListener("popstate", syncToHash);
    window.addEventListener("hashchange", syncToHash);

    syncToHash();
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = document.querySelector("[data-form]");
    if (!form) return;

    var status = form.querySelector("[data-form-status]");
    var button = form.querySelector("button[type=submit]");
    var original = button ? button.textContent : "";

    function say(message, ok) {
      if (!status) return;
      status.textContent = message;
      status.className = "form-status is-shown " + (ok ? "is-ok" : "is-bad");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        say("Fill in name, a valid email, and a message.", false);
        form.reportValidity();
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Sending";
      }

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed: " + res.status);
          form.reset();
          say("Message sent. You will hear back within two business days.", true);
        })
        .catch(function () {
          say("That did not send. Email calebtlawson@gmail.com directly and it will get through.", false);
        })
        .then(function () {
          if (button) {
            button.disabled = false;
            button.textContent = original;
          }
        });
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    var catalog = window.CLAW_PROJECTS || [];
    initNav();
    initGrids(catalog);
    initFilters();
    initSort();
    initModal(catalog);
    initForm();
    initYear();
    fitPlates(document);   /* standalone project pages render plates in the HTML */
    Array.prototype.forEach.call(document.querySelectorAll("img[data-guard]"), guardImage);
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
