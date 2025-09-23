// scripts/modules/portfolioHover.js
// SwiftSendMax 1.0 — Portfolio filters + hover/focus video previews (vanilla ES module)
// A11y-first: radio/tab-like chips with roving focus, aria-selected/checked,
// keyboard arrows/Home/End, and proper aria-hidden/hidden on cards.
// Perf: event delegation, minimal DOM reads, guards, no polling, no global leaks.

import { qs, qsa, prefersReducedMotion } from "../utils/dom.js";

let _wired = false;

/* ------------------------------- Selectors ------------------------------- */
// Support all historical shapes used in the project
const FILTER_CONTAINER_SELS = [".work__filters", ".work-filter", ".filters"];
const FILTER_BTN_SEL = "[role='radio'], [role='tab'], [data-filter], [data-category]";
const CARD_SELECTOR = ".work-card";

// Accept multiple possible video hooks
const VIDEO_SELECTOR = "video[data-hover-video], .work-card__video, video";

/* -------------------------------- Helpers -------------------------------- */
function getFilterValue(btn) {
  return (
    btn?.dataset?.filter ||
    btn?.dataset?.category ||
    btn?.getAttribute?.("data-filter") ||
    btn?.getAttribute?.("data-category") ||
    btn?.getAttribute?.("aria-label") ||
    "all"
  ).toLowerCase();
}

function getTags(card) {
  // Accept data-tags or data-category on cards
  const ds = (card?.dataset?.tags || card?.dataset?.category || "").toLowerCase();
  return ds.split(/\s+/).filter(Boolean);
}

function setActiveButton(activeBtn, buttons) {
  buttons.forEach((btn) => {
    const isActive = btn === activeBtn;
    const role = btn.getAttribute("role");
    if (role === "radio") {
      btn.setAttribute("aria-checked", String(isActive));
    } else if (role === "tab") {
      btn.setAttribute("aria-selected", String(isActive));
    } else {
      // generic buttons
      btn.setAttribute("aria-selected", String(isActive));
    }
    btn.classList.toggle("is-active", isActive);
    // Roving tabindex for keyboard nav within the group
    btn.tabIndex = isActive ? 0 : -1;
  });
}

// Pause a card’s video (if any). Optionally reset the time.
function pauseCardVideo(card, resetTime = false) {
  const video = card.querySelector(VIDEO_SELECTOR);
  if (!video) return;
  try {
    if (!video.paused) video.pause();
    if (resetTime) video.currentTime = 0;
  } catch {
    /* no-op */
  }
}

// Lazy-attach video src on first interaction (if data-hover-video/src present)
function ensureVideoSrc(video) {
  if (!video) return;
  if (video.dataset.hoverLoaded === "true") return;
  const src = video.dataset.hoverSrc || video.dataset.hoverVideo;
  if (src && !video.src) {
    video.src = src;
    video.dataset.hoverLoaded = "true";
  }
}

// Play on hover/focus (respect reduced motion)
function playCardVideo(card) {
  const video = card.querySelector(VIDEO_SELECTOR);
  if (!video) return;
  ensureVideoSrc(video);
  if (prefersReducedMotion()) return;
  // Better autoplay odds
  try {
    video.muted = true;
    video.playsInline = true;
  } catch {}
  const p = video.play?.();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

/* -------------------------------- Filtering -------------------------------- */
function applyFilter(category, cards) {
  const cat = (category || "all").toLowerCase();

  cards.forEach((card) => {
    const tags = getTags(card);
    const match = cat === "all" || tags.includes(cat);

    card.classList.toggle("is-hidden", !match);
    card.setAttribute("aria-hidden", String(!match));

    if (!match) {
      card.setAttribute("hidden", "");
      card.tabIndex = -1;
      pauseCardVideo(card, true);
    } else {
      card.removeAttribute("hidden");
      if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
      else if (card.tabIndex < 0) card.tabIndex = 0;
    }
  });
}

function handleFilterKeydown(event, buttons) {
  const { key, currentTarget } = event;
  const i = buttons.indexOf(currentTarget);
  if (i < 0) return;

  let next = i;
  if (key === "ArrowRight" || key === "ArrowDown") next = (i + 1) % buttons.length;
  else if (key === "ArrowLeft" || key === "ArrowUp") next = (i - 1 + buttons.length) % buttons.length;
  else if (key === "Home") next = 0;
  else if (key === "End") next = buttons.length - 1;
  else if (key === " " || key === "Enter") {
    event.preventDefault();
    currentTarget.click();
    return;
  } else {
    return;
  }

  event.preventDefault();
  const btn = buttons[next];
  btn?.focus();
  btn?.click();
}

/* ----------------------------- Card Enhancements ----------------------------- */
function enhanceCardPreview(card) {
  const onEnter = () => playCardVideo(card);
  const onLeave = () => pauseCardVideo(card, false);

  card.addEventListener("mouseenter", onEnter);
  card.addEventListener("focusin", onEnter);
  card.addEventListener("mouseleave", onLeave);
  card.addEventListener("focusout", onLeave);
}

/* ---------------------------------- Init ---------------------------------- */
export function initPortfolioHover() {
  if (_wired) return;
  _wired = true;

  // Cards base a11y + preview wiring
  const cards = Array.from(qsa(CARD_SELECTOR));
  if (cards.length) {
    cards.forEach((card) => {
      if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
      card.setAttribute("aria-hidden", "false");
      enhanceCardPreview(card);
    });

    // Pause videos if tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cards.forEach((c) => pauseCardVideo(c, true));
    });
  }

  // Wire each filter container independently (event delegation per group)
  const containers = FILTER_CONTAINER_SELS.flatMap((sel) => Array.from(qsa(sel)));
  if (!containers.length) {
    // No filters present — default show all
    applyFilter("all", cards);
    return;
  }

  containers.forEach((container) => {
    const buttons = Array.from(container.querySelectorAll(FILTER_BTN_SEL));
    if (!buttons.length) return;

    // Ensure type=button and initial roving tabindex
    buttons.forEach((btn) => {
      if (!btn.hasAttribute("type")) btn.type = "button";
      const selected =
        btn.getAttribute("aria-checked") === "true" ||
        btn.getAttribute("aria-selected") === "true" ||
        btn.classList.contains("is-active");
      btn.tabIndex = selected ? 0 : -1;
    });

    // Choose initial active (keep markup’s pick if present)
    const initial =
      buttons.find(
        (b) =>
          b.getAttribute("aria-checked") === "true" ||
          b.getAttribute("aria-selected") === "true" ||
          b.classList.contains("is-active")
      ) || buttons[0];

    if (initial) {
      setActiveButton(initial, buttons);
      applyFilter(getFilterValue(initial), cards);
    } else {
      applyFilter("all", cards);
    }

    // Click delegation (fast, minimal listeners)
    container.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest(FILTER_BTN_SEL);
      if (!btn || !container.contains(btn)) return;

      setActiveButton(btn, buttons);
      applyFilter(getFilterValue(btn), cards);
    });

    // Keyboard nav per button (radio/tab behavior)
    buttons.forEach((btn) => {
      btn.addEventListener("keydown", (ev) => handleFilterKeydown(ev, buttons));
    });
  });
}

export default initPortfolioHover;
