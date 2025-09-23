// scripts/modules/header.js
// SwiftSendMax 1.0 — Header behavior (vanilla ES module)
// - Mobile full-screen dialog with focus trap
// - A11y-first: aria-expanded / aria-hidden / inert, ESC-to-close, focus restore
// - Perf: passive listeners, rAF scroll shadow, no globals leaked
// - Idempotent: safe to call multiple times

import { qs, qsa, addClass, removeClass, rafQueue } from "../utils/dom.js";

let _wired = false;

// ===== constants =====
const HEADER_SEL = ".header";
const BODY_LOCK_CLASS = "is-locked";
const DIALOG_ID = "#mobileMenu";
const OPENER_SEL = ".menu-toggle[data-open-menu]";
const CLOSE_SEL = "[data-close-menu]";
const PAGE_BODY_SEL = "body.ss-body";
const PAGE_MAIN_SEL = "#mainContent";
const SCROLL_SHADOW_THRESHOLD = 8;
const FOCUSABLE_SEL =
  "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";

export default function initHeader() {
  if (_wired) return;
  _wired = true;

  // Elements (guard everything)
  const header = qs(HEADER_SEL);
  const body = qs(PAGE_BODY_SEL) || document.body;
  const main = qs(PAGE_MAIN_SEL) || qs("main");
  const opener = qs(OPENER_SEL);
  const dialog = qs(`${DIALOG_ID}.mobile-menu[role="dialog"][aria-modal="true"]`);

  // Always wire scroll shadow (even if menu pieces are missing)
  wireScrollShadow(header);

  if (!opener || !dialog) return; // nothing else to wire

  // State
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastFocusedBeforeOpen = null;
  let focusables = [];
  let firstFocusable = null;
  let lastFocusable = null;
  let escAndTrapBound = false;

  // Ensure dialog starts closed/inert (in case markup slipped)
  setDialogState({ open: dialog.getAttribute("aria-hidden") === "false" ? false : false });

  // ===== open/close/toggle =====
  function openMenu() {
    if (isOpen()) return;
    lastFocusedBeforeOpen =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    setDialogState({ open: true });

    // Focus trap: compute once on open
    computeFocusables();
    if (firstFocusable) {
      // preventScroll to avoid layout thrash
      firstFocusable.focus({ preventScroll: true });
    }

    // One keydown handler for ESC + TAB trap while open
    if (!escAndTrapBound) {
      document.addEventListener("keydown", onKeydownWhileOpen, { capture: true });
      escAndTrapBound = true;
    }

    // Close on window hash route changes (anchor nav)
    window.addEventListener("hashchange", closeMenu, { once: true });

    // Optional: if viewport radically changes, close (avoids layout jumps)
    window.addEventListener("resize", closeMenu, { once: true });

    // On open we announce state to CSS for animations
    dialog.dataset.state = "open";
  }

  function closeMenu() {
    if (!isOpen()) return;
    setDialogState({ open: false });

    // Release keydown handler
    if (escAndTrapBound) {
      document.removeEventListener("keydown", onKeydownWhileOpen, { capture: true });
      escAndTrapBound = false;
    }

    // Restore focus to prior element or opener
    const target =
      (lastFocusedBeforeOpen && document.contains(lastFocusedBeforeOpen) && lastFocusedBeforeOpen) ||
      opener;
    if (target) target.focus({ preventScroll: true });
    lastFocusedBeforeOpen = null;

    // Announce state for CSS
    dialog.dataset.state = "closed";
  }

  function toggleMenu() {
    isOpen() ? closeMenu() : openMenu();
  }

  function isOpen() {
    return dialog.getAttribute("aria-hidden") === "false";
  }

  function setDialogState({ open }) {
    dialog.setAttribute("aria-hidden", String(!open));
    if (open) {
      dialog.removeAttribute("inert");
      opener.setAttribute("aria-expanded", "true");
      addClass(body, BODY_LOCK_CLASS);
    } else {
      dialog.setAttribute("inert", "");
      opener.setAttribute("aria-expanded", "false");
      removeClass(body, BODY_LOCK_CLASS);
    }
  }

  // ===== focus management =====
  function computeFocusables() {
    const all = qsa(FOCUSABLE_SEL, dialog).filter((el) => {
      if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") return false;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      // Hidden via details/summary or off-screen
      const rect = el.getBoundingClientRect();
      return !(rect.width === 0 && rect.height === 0);
    });
    focusables = all;
    firstFocusable = focusables[0] || null;
    lastFocusable = focusables[focusables.length - 1] || null;
  }

  function onKeydownWhileOpen(e) {
    // ESC anywhere closes
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    // TAB trap
    if (e.key !== "Tab") return;
    if (!focusables.length) return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  // ===== backdrop (outside) clicks =====
  // Clicking on the dialog backdrop (outside inner content) closes.
  dialog.addEventListener("pointerdown", (e) => {
    // If the click originates on the backdrop element itself, close.
    if (e.target === dialog) {
      // Delay the actual close until pointerup to avoid selection glitches
      const onUp = () => {
        closeMenu();
        dialog.removeEventListener("pointerup", onUp);
      };
      dialog.addEventListener("pointerup", onUp, { once: true });
    }
  });

  // ===== open/close bindings =====
  opener.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu();
  });

  // Delegate all close buttons/links (works for future nodes too)
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.matches(CLOSE_SEL) || target.closest(CLOSE_SEL)) {
      // Allow navigation to proceed; just close immediately
      closeMenu();
    }
  });

  // Defensive: if main is clicked while menu open, allow normal behavior.
  // (No overlay-click-to-close here; backdrop handler above handles it.)

  // ===== reduced motion respect =====
  if (reduceMotion) {
    // We don't add JS delays; CSS should already respect prefers-reduced-motion.
    // This is a placeholder to keep parity if future JS timing is added.
  }
}

/* ===== helpers ===== */

function wireScrollShadow(header) {
  if (!header) return;
  let ticking = false;

  function updateShadow() {
    ticking = false;
    const hasShadow = window.scrollY > SCROLL_SHADOW_THRESHOLD;
    header.classList.toggle("has-shadow", hasShadow);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateShadow);
    }
  }

  // Initial apply
  updateShadow();

  window.addEventListener("scroll", onScroll, { passive: true });
}
