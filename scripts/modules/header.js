// /scripts/modules/header.js
// Accessible desktop navigation highlights + mobile full-screen menu with focus trapping

import { qs, qsa, addClass, removeClass } from "../utils/dom.js";

const ACTIVE_OFFSET = 120;
let toggleButton;
let mobileMenu;
let previousFocus = null;
let focusableEls = [];
let firstFocusable;
let lastFocusable;

function markActiveLink() {
  const sections = qsa("main section[id]");
  const scrollY = window.scrollY + ACTIVE_OFFSET;

  let currentId = sections[0]?.id;
  for (const section of sections) {
    if (section.offsetTop <= scrollY) {
      currentId = section.id;
    } else {
      break;
    }
  }

  qsa(".nav__link").forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === `#${currentId}`;
    if (isActive) {
      link.dataset.active = "true";
      link.setAttribute("aria-current", "page");
    } else {
      delete link.dataset.active;
      link.removeAttribute("aria-current");
    }
  });
}

function setMenuState(open) {
  if (!mobileMenu || !toggleButton) return;

  toggleButton.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
  toggleButton.classList.toggle("is-active", open);
  mobileMenu.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}

function onTrapKeydown(event) {
  if (event.key === "Escape") {
    closeMenu();
    return;
  }

  if (event.key !== "Tab" || focusableEls.length === 0) return;

  if (event.shiftKey) {
    if (document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    }
  } else if (document.activeElement === lastFocusable) {
    event.preventDefault();
    firstFocusable.focus();
  }
}

function trapFocus(container) {
  focusableEls = qsa(
    "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])",
    container
  ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

  firstFocusable = focusableEls[0];
  lastFocusable = focusableEls[focusableEls.length - 1];

  container.addEventListener("keydown", onTrapKeydown);

  if (firstFocusable) {
    firstFocusable.focus({ preventScroll: true });
  }
}

function releaseFocus() {
  if (!mobileMenu) return;
  mobileMenu.removeEventListener("keydown", onTrapKeydown);
  focusableEls = [];
  firstFocusable = null;
  lastFocusable = null;
}

function openMenu() {
  if (mobileMenu?.classList.contains("is-open")) return;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  setMenuState(true);
  trapFocus(mobileMenu);
  window.addEventListener("resize", closeMenu, { once: true });
}

export function closeMenu() {
  if (!mobileMenu?.classList.contains("is-open")) return;
  setMenuState(false);
  releaseFocus();
  window.removeEventListener("resize", closeMenu);
  if (previousFocus) {
    previousFocus.focus({ preventScroll: true });
  } else if (toggleButton) {
    toggleButton.focus({ preventScroll: true });
  }
}

function handleToggle() {
  if (mobileMenu?.classList.contains("is-open")) {
    closeMenu();
  } else {
    openMenu();
  }
}

function handleScroll() {
  markActiveLink();

  const header = qs(".header");
  if (!header) return;
  if (window.scrollY > 32) {
    addClass(header, "header--raised");
  } else {
    removeClass(header, "header--raised");
  }
}

function bindMobileMenu() {
  toggleButton = qs(".menu-toggle");
  mobileMenu = qs("#mobileMenu");
  if (!toggleButton || !mobileMenu) return;

  toggleButton.addEventListener("click", handleToggle);

  qsa("[data-close-menu]").forEach((el) => {
    el.addEventListener("click", closeMenu);
  });
}

export function initHeader() {
  markActiveLink();
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", markActiveLink);

  bindMobileMenu();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

export default initHeader;
