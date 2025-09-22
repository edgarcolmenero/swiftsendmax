// /scripts/modules/header.js
// Desktop active link sync + mobile full-screen menu toggle with focus trap

import { qs, qsa, addClass, removeClass, rafQueue } from "../utils/dom.js";

const SCROLL_THRESHOLD = 80;
const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";

let lastActiveLink = null;
let lastFocusedEl = null;
let releaseFocusTrap = null;

function syncActiveLink() {
  const links = qsa(".ss-nav a[href^='#']");
  if (!links.length) return;

  const fromTop = window.scrollY + 100;
  let current = null;

  links.forEach((link) => {
    const targetId = link.getAttribute("href");
    if (!targetId) return;

    const section = qs(targetId);
    if (!section) return;

    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (fromTop >= top && fromTop < bottom) {
      current = link;
    }
  });

  if (lastActiveLink && lastActiveLink !== current) {
    lastActiveLink.classList.remove("is-active");
    lastActiveLink = null;
  }

  if (current && current !== lastActiveLink) {
    current.classList.add("is-active");
    lastActiveLink = current;
  }
}

function updateHeaderFade() {
  const header = qs(".ss-header");
  if (!header) return;

  const shouldFade = window.scrollY > SCROLL_THRESHOLD;
  header.classList.toggle("header-fade", shouldFade);
}

const handleScroll = rafQueue(() => {
  syncActiveLink();
  updateHeaderFade();
});

function trapFocus(container) {
  const focusables = qsa(FOCUSABLE_SELECTOR, container).filter((el) => {
    if (el.hasAttribute("disabled") || el.tabIndex === -1) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  });

  if (!focusables.length) {
    return () => {};
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  function handleTab(event) {
    if (event.key !== "Tab") return;

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener("keydown", handleTab);

  requestAnimationFrame(() => {
    first.focus({ preventScroll: true });
  });

  return () => {
    container.removeEventListener("keydown", handleTab);
  };
}

function handleEsc(event) {
  if (event.key === "Escape") {
    closeMenu();
  }
}

function openMenu() {
  const menu = qs("#mobileMenu");
  const toggle = qs("[data-open-menu]");
  if (!menu || !toggle) return;

  if (menu.getAttribute("aria-hidden") === "false") return;

  lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  menu.setAttribute("aria-hidden", "false");
  toggle.setAttribute("aria-expanded", "true");
  addClass(document.body, "menu-open");

  releaseFocusTrap = trapFocus(menu);

  document.addEventListener("keydown", handleEsc);
}

function closeMenu() {
  const menu = qs("#mobileMenu");
  const toggle = qs("[data-open-menu]");
  if (!menu || !toggle) return;

  if (menu.getAttribute("aria-hidden") === "true") return;

  menu.setAttribute("aria-hidden", "true");
  toggle.setAttribute("aria-expanded", "false");
  removeClass(document.body, "menu-open");

  if (releaseFocusTrap) {
    releaseFocusTrap();
    releaseFocusTrap = null;
  }

  document.removeEventListener("keydown", handleEsc);

  if (lastFocusedEl) {
    lastFocusedEl.focus({ preventScroll: true });
    lastFocusedEl = null;
  }
}

function toggleMenu() {
  const menu = qs("#mobileMenu");
  if (!menu) return;

  const isOpen = menu.getAttribute("aria-hidden") === "false";
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

export function initHeader() {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });

  const toggle = qs("[data-open-menu]");
  if (toggle) {
    toggle.addEventListener("click", toggleMenu);
  }

  const menu = qs("#mobileMenu");
  if (menu) {
    qsa("[data-close-menu]", menu).forEach((el) => {
      el.addEventListener("click", closeMenu);
    });
  }
}
