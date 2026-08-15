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
      ? '<div class="card-figure">' +
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

  /* ---------- Detail modal ---------- */
  function initModal(catalog) {
    var modal = document.querySelector("[data-modal]");
    if (!modal) return;

    var panel = modal.querySelector("[data-modal-content]");
    var lastFocus = null;

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function open(id) {
      var p = null;
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].id === id) {
          p = catalog[i];
          break;
        }
      }
      if (!p) return;

      lastFocus = document.activeElement;

      var plates = (p.plates || [])
        .map(function (pl) {
          return (
            '<figure class="plate">' +
            '<img class="plate-img" src="' +
            escapeHtml(pl.src) +
            '" alt="' +
            escapeHtml(pl.cap || "") +
            '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
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
        '<button class="modal-close" type="button" data-modal-close>Close</button>' +
        "</div>" +
        '<div class="modal-body">' +
        '<h2 class="modal-title" id="modal-title">' +
        escapeHtml(p.title) +
        "</h2>" +
        (tags ? '<div class="card-tags" style="margin-bottom:1.75rem">' + tags + "</div>" : "") +
        (plates ? '<div class="plates">' + plates + "</div>" : "") +
        '<dl class="notes">' +
        notes +
        "</dl></div>";

      Array.prototype.forEach.call(panel.querySelectorAll("img"), function (img) {
        img.addEventListener("error", function () {
          var fig = img.closest(".plate");
          if (fig) fig.remove();
        });
      });

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      modal.scrollTop = 0;
      document.body.style.overflow = "hidden";

      var closeBtn = panel.querySelector("[data-modal-close]");
      if (closeBtn) closeBtn.focus();
    }

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-project]");
      if (trigger) {
        open(trigger.getAttribute("data-project"));
        return;
      }
      if (e.target.closest("[data-modal-close]")) {
        close();
        return;
      }
      if (e.target === modal) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
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
    initModal(catalog);
    initForm();
    initYear();
    Array.prototype.forEach.call(document.querySelectorAll("img[data-guard]"), guardImage);
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
