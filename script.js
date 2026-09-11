/* NextGen Consultants — sample site behaviour
   Plain ES2015+, no build step, no dependencies. */

(function () {
  "use strict";

  /* ---------- 1. Service cards rendered from data ---------- */

  const SERVICES = [
    {
      icon: "☁️",
      title: "Cloud & Platform",
      body: "Landing zones, Kubernetes, and IaC that your engineers can actually operate."
    },
    {
      icon: "📊",
      title: "Data & Analytics",
      body: "Warehouses, pipelines, and governed reporting that leadership trusts."
    },
    {
      icon: "🔐",
      title: "Security & Compliance",
      body: "Threat modelling, identity design, and audit readiness without theatre."
    },
    {
      icon: "⚙️",
      title: "Delivery Enablement",
      body: "CI/CD, automated testing, and the engineering habits that make them stick."
    }
  ];

  function renderServices() {
    const grid = document.getElementById("serviceGrid");
    if (!grid) return;

    const fragment = document.createDocumentFragment();

    SERVICES.forEach(function (service) {
      const card = document.createElement("article");
      card.className = "card reveal";

      const icon = document.createElement("div");
      icon.className = "card-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = service.icon;

      const heading = document.createElement("h3");
      heading.textContent = service.title;

      const body = document.createElement("p");
      body.textContent = service.body;

      card.append(icon, heading, body);
      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  /* ---------- 2. Theme toggle, persisted per browser ---------- */

  function initTheme() {
    const root = document.documentElement;
    const button = document.getElementById("themeToggle");
    const icon = document.getElementById("themeIcon");
    if (!button || !icon) return;

    // localStorage can throw in private/blocked contexts, so every access is guarded.
    function readStored() {
      try {
        return localStorage.getItem("ngc-theme");
      } catch (err) {
        return null;
      }
    }

    function writeStored(value) {
      try {
        localStorage.setItem("ngc-theme", value);
      } catch (err) {
        /* preference simply won't persist */
      }
    }

    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    function apply(theme) {
      root.setAttribute("data-theme", theme);
      const goingDark = theme === "dark";
      icon.textContent = goingDark ? "☀" : "☽";
      button.setAttribute(
        "aria-label",
        goingDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }

    apply(readStored() || (prefersDark ? "dark" : "light"));

    button.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      writeStored(next);
    });
  }

  /* ---------- 3. Mobile navigation ---------- */

  function initNav() {
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      const isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close after tapping a link on small screens.
    menu.addEventListener("click", function (event) {
      if (event.target.tagName === "A") close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  /* ---------- 4. Animated stat counters ---------- */

  function animateCount(el) {
    const target = Number(el.dataset.countTo);
    if (!Number.isFinite(target)) return;

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ---------- 5. Reveal on scroll + counter trigger ---------- */

  function initObservers() {
    const revealTargets = document.querySelectorAll(".reveal");
    const counters = document.querySelectorAll("[data-count-to]");

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) {
        el.classList.add("visible");
      });
      counters.forEach(animateCount);
      return;
    }

    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });

    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ---------- 6. Contact form validation ---------- */

  function initForm() {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    if (!form || !status) return;

    const RULES = {
      name: function (value) {
        return value.trim().length >= 2 ? "" : "Please enter your name.";
      },
      email: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
          ? ""
          : "Please enter a valid email address.";
      },
      message: function (value) {
        return value.trim().length >= 10
          ? ""
          : "Please give us at least 10 characters of detail.";
      }
    };

    function showError(field, message) {
      const slot = form.querySelector('[data-error-for="' + field.id + '"]');
      if (slot) slot.textContent = message;
      field.setAttribute("aria-invalid", message ? "true" : "false");
      return !message;
    }

    function validateField(field) {
      const rule = RULES[field.name];
      return rule ? showError(field, rule(field.value)) : true;
    }

    Object.keys(RULES).forEach(function (name) {
      const field = form.elements[name];
      if (!field) return;
      // Validate on blur, then live-correct only fields already flagged.
      field.addEventListener("blur", function () {
        validateField(field);
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.textContent = "";
      status.classList.remove("ok");

      let firstInvalid = null;

      Object.keys(RULES).forEach(function (name) {
        const field = form.elements[name];
        if (!field) return;
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        status.textContent = "Please fix the highlighted fields.";
        return;
      }

      // Static site: there is no backend, so this only demonstrates the success path.
      status.textContent =
        "Thanks, " + form.elements.name.value.trim() + " — this demo form does not send anything yet.";
      status.classList.add("ok");
      form.reset();

      Object.keys(RULES).forEach(function (name) {
        const field = form.elements[name];
        if (field) showError(field, "");
      });
    });
  }

  /* ---------- 7. Footer year ---------- */

  function initYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- Boot ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    renderServices();
    initTheme();
    initNav();
    initObservers();
    initForm();
    initYear();
  });
})();
