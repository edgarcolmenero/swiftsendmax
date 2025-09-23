// /scripts/modules/header.js
// Desktop active link sync + mobile full-screen menu toggle with focus trap

import { qs, qsa, addClass, removeClass } from "../utils/dom.js";

let lastActiveLink = null;
let lastFocusedEl = null;

function setActiveLink() {
  const links = qsa("nav a[href^='#']");
  const fromTop = window.scrollY + 100;

  links.forEach((link) => {
    const section = qs(link.getAttribute("href"));
    if (section && section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
      if (lastActiveLink) {
        lastActiveLink.classList.remove("is-active");
        lastActiveLink.removeAttribute("aria-current");
      }
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
      lastActiveLink = link;
    }
  });
}

function openMenu() {
  const body = document.body;
  const menu = qs(".mobile-menu");
  const toggle = qs(".menu-toggle");

  addClass(body, "menu-open");
  addClass(menu, "is-open");
  addClass(toggle, "is-active");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  if (menu) menu.setAttribute("aria-hidden", "false");

  lastFocusedEl = document.activeElement;
  trapFocus(menu);

  document.addEventListener("keydown", handleEsc);
}

function closeMenu() {
  const body = document.body;
  const menu = qs(".mobile-menu");
  const toggle = qs(".menu-toggle");

  removeClass(body, "menu-open");
  removeClass(menu, "is-open");
  removeClass(toggle, "is-active");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
  if (menu) menu.setAttribute("aria-hidden", "true");

  releaseFocus();

  document.removeEventListener("keydown", handleEsc);

  if (lastFocusedEl) lastFocusedEl.focus();
}

function toggleMenu() {
  document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
}

function handleEsc(e) {
  if (e.key === "Escape") closeMenu();
}

// Focus trap
let focusableEls = [];
let firstEl, lastEl;

function trapFocus(container) {
  focusableEls = qsa(
    "a[href], button, textarea, input, select, [tabindex]:not([tabindex='-1'])",
    container
  ).filter((el) => !el.disabled && el.offsetParent !== null);

  firstEl = focusableEls[0];
  lastEl = focusableEls[focusableEls.length - 1];

  container.addEventListener("keydown", handleTab);
}

function releaseFocus() {
  const menu = qs(".mobile-menu");
  if (menu) menu.removeEventListener("keydown", handleTab);
}

function handleTab(e) {
  if (e.key !== "Tab") return;

  if (e.shiftKey) {
    if (document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    }
  } else {
    if (document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }
}

export function initHeader() {
  // Desktop active link sync
  window.addEventListener("scroll", setActiveLink);
  setActiveLink();

  // Mobile menu toggle
  const toggle = qs(".menu-toggle");
  if (toggle) toggle.addEventListener("click", toggleMenu);

  const closeButton = qs(".mobile-menu__close");
  if (closeButton) closeButton.addEventListener("click", closeMenu);

  // Close menu on nav link click
  qsa(".mobile-menu a").forEach((link) =>
    link.addEventListener("click", closeMenu)
  );
}
