/* ==========================================================================
   NextGen Consultants — site behaviour
   Plain ES2015+, no dependencies, no build step.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Configuration

     formEndpoint: the Power Automate "When an HTTP request is received"
     trigger URL. Paste it here once the flow exists — until then the contact
     form validates fully and then tells the visitor to email instead, rather
     than silently pretending to send.

     This URL is public by nature: anyone viewing source can post to it. It is
     write-only so nothing leaks, but see PLAN.md section 5 for the spam guards
     (honeypot + time-trap below, plus a condition on the flow side).
     ------------------------------------------------------------------------ */
  var CONFIG = {
    formEndpoint: "",
    fallbackEmail: "",
    minSubmitSeconds: 3
  };

  /* ------------------------------------------------------------------------
     1. Header: compact-on-scroll
     ------------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------------
     2. Mobile navigation
     Focus is trapped while open and restored to the toggle on close, so
     keyboard and screen-reader users are not stranded behind the menu.
     ------------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;

    function isOpen() {
      return menu.classList.contains("is-open");
    }

    function open() {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function close(returnFocus) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) close(false); else open();
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) close(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) close(true);
      if (event.key !== "Tab" || !isOpen()) return;

      var focusables = menu.querySelectorAll("a, button");
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        toggle.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      if (!menu.contains(event.target) && !toggle.contains(event.target)) close(false);
    });

    // Reset when resizing up to desktop, so the menu is never stuck open.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && isOpen()) close(false);
    });
  }

  /* ------------------------------------------------------------------------
     3. Mark the current page in the navigation
     ------------------------------------------------------------------------ */
  function initActiveNav() {
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    var links = document.querySelectorAll(".nav-menu a[href]");

    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;

      var linkPath = new URL(href, window.location.origin + "/").pathname
        .replace(/\/index\.html$/, "/");

      if (linkPath === path) link.setAttribute("aria-current", "page");
    });
  }

  /* ------------------------------------------------------------------------
     4. Reveal on scroll
     ------------------------------------------------------------------------ */
  function initReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     5. Back to top
     ------------------------------------------------------------------------ */
  function initToTop() {
    var button = document.getElementById("toTop");
    if (!button) return;

    var ticking = false;
    function update() {
      button.classList.toggle("is-visible", window.scrollY > 600);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    button.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });

    update();
  }

  /* ------------------------------------------------------------------------
     6. Contact form
     ------------------------------------------------------------------------ */
  function initForm() {
    var form = document.getElementById("inquiryForm");
    if (!form) return;

    var status = document.getElementById("formStatus");
    var submitBtn = form.querySelector('button[type="submit"]');
    var renderedAt = Date.now();

    var RULES = {
      name: function (v) {
        return v.trim().length >= 2 ? "" : "Please enter your full name.";
      },
      email: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
          ? "" : "Please enter a valid business email address.";
      },
      country: function (v) {
        return v.trim() ? "" : "Please select your country.";
      },
      inquiryType: function (v) {
        return v.trim() ? "" : "Please choose an inquiry type.";
      },
      message: function (v) {
        return v.trim().length >= 20
          ? "" : "Please describe your requirement in at least 20 characters.";
      },
      consent: function (_v, field) {
        return field.checked ? "" : "Please confirm you agree to be contacted.";
      }
    };

    function setError(field, message) {
      var slot = form.querySelector('[data-error-for="' + field.name + '"]');
      if (slot) slot.textContent = message;
      field.setAttribute("aria-invalid", message ? "true" : "false");
      return !message;
    }

    function validate(field) {
      var rule = RULES[field.name];
      return rule ? setError(field, rule(field.value, field)) : true;
    }

    Object.keys(RULES).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      var event = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "blur";
      field.addEventListener(event, function () { validate(field); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") validate(field);
      });
    });

    function say(message, kind) {
      status.textContent = message;
      status.classList.remove("is-ok", "is-error");
      if (kind) status.classList.add(kind);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      say("");

      // Honeypot: hidden from humans, so anything here is a bot. Report
      // success so the bot does not learn it was caught.
      if (form.elements.website && form.elements.website.value) {
        say("Thank you. Your message has been received.", "is-ok");
        form.reset();
        return;
      }

      // Time-trap: a human cannot read and complete this form in under a
      // few seconds.
      if ((Date.now() - renderedAt) / 1000 < CONFIG.minSubmitSeconds) {
        say("Please take a moment to complete the form, then submit again.", "is-error");
        return;
      }

      var firstInvalid = null;
      Object.keys(RULES).forEach(function (name) {
        var field = form.elements[name];
        if (!field) return;
        if (!validate(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        say("Please correct the highlighted fields.", "is-error");
        return;
      }

      var payload = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone ? form.elements.phone.value.trim() : "",
        organisation: form.elements.organisation ? form.elements.organisation.value.trim() : "",
        country: form.elements.country.value,
        inquiryType: form.elements.inquiryType.value,
        technologies: form.elements.technologies ? form.elements.technologies.value.trim() : "",
        message: form.elements.message.value.trim(),
        submittedAt: new Date().toISOString(),
        sourcePage: window.location.pathname
      };

      // No endpoint configured yet — be honest rather than pretend to send.
      // Never point the visitor at another route that is also not live.
      if (!CONFIG.formEndpoint) {
        say(
          CONFIG.fallbackEmail
            ? "This form is not connected yet. Please email us at " +
                CONFIG.fallbackEmail + " and we will respond."
            : "This form is not connected yet, so your message has not been sent. " +
                "Please check back shortly.",
          "is-error"
        );
        return;
      }

      submitBtn.disabled = true;
      say("Sending your enquiry…");

      fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed with status " + response.status);
          say("Thank you. Your enquiry has been received and we will respond within two business days.", "is-ok");
          form.reset();
          renderedAt = Date.now();
          Object.keys(RULES).forEach(function (name) {
            var field = form.elements[name];
            if (field) setError(field, "");
          });
        })
        .catch(function () {
          var where = CONFIG.fallbackEmail ? " Please email " + CONFIG.fallbackEmail + " instead." : "";
          say("Sorry, your enquiry could not be sent." + where, "is-error");
        })
        .then(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ------------------------------------------------------------------------
     7. Footer year
     ------------------------------------------------------------------------ */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    initHeader();
    initNav();
    initActiveNav();
    initReveal();
    initToTop();
    initForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
