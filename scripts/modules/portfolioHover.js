// scripts/modules/portfolioHover.js
// SwiftSendMax 1.0 — Portfolio filters + hover/focus video previews (vanilla ES module)
// A11y-first: radio-like filter chips with roving focus, aria-selected/checked,
// keyboard arrows/Home/End, and proper aria-hidden/hidden on cards.
// Perf: event delegation, minimal DOM reads, guards, no polling, no global leaks.

import { qs, qsa, prefersReducedMotion } from "../utils/dom.js";

let _wired = false;

// Support both historical selector shapes used in the project
const FILTER_CONTAINER_SEL = ".work__filters, .work-filter";
const FILTER_BTN_SEL = "[role='radio'], [data-filter]";
const CARD_SELECTOR = ".work-card";

// Accept multiple possible video hooks
const VIDEO_SELECTOR = "video, .work-card__video";

// Helper: get category value from a filter button
function getFilterValue(btn) {
  return (
    btn?.dataset?.filter ||
    btn?.getAttribute?.("data-filter") ||
    btn?.getAttribute?.("aria-label") ||
    "all"
  ).toLowerCase();
}

// Helper: read tags from a card's data-tags
function getTags(card) {
  const ds = card?.dataset?.tags || "";
  return ds.split(/\s+/).filter(Boolean);
}

// Apply active visuals/aria to filter button set
function setActiveButton(activeBtn, buttons) {
  buttons.forEach((btn) => {
    const isActive = btn === activeBtn;
    // Support both role=radio and generic buttons
    if (btn.getAttribute("role") === "radio") {
      btn.setAttribute("aria-checked", String(isActive));
    } else {
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
  const p = video.play?.();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

// Filter logic: show/hide cards by tag, a11y attributes aligned
function applyFilter(category, cards) {
  const cat = (category || "all").toLowerCase();

  cards.forEach((card) => {
    const tags = getTags(card);
    const match = cat === "all" || tags.includes(cat);

    // Visibility + a11y
    card.classList.toggle("is-hidden", !match);
    card.setAttribute("aria-hidden", String(!match));
    // Mirror semantic "hidden" for assistive tech / tab stops
    if (!match) {
      card.setAttribute("hidden", "");
      card.tabIndex = -1;
      // Stop preview if card is removed from view
      pauseCardVideo(card, true);
    } else {
      card.removeAttribute("hidden");
      if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
      else if (card.tabIndex < 0) card.tabIndex = 0;
    }
  });
}

// Keyboard support for filter chips (arrow keys, Home/End, Space/Enter)
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
  } else return;

  event.preventDefault();
  const btn = buttons[next];
  btn?.focus();
  btn?.click();
}

// Enhance a single card for hover/focus previews
function enhanceCardPreview(card) {
  const onEnter = () => playCardVideo(card);
  const onLeave = () => pauseCardVideo(card, false);

  // Pointer + keyboard focus
  card.addEventListener("mouseenter", onEnter);
  card.addEventListener("focusin", onEnter);
  card.addEventListener("mouseleave", onLeave);
  card.addEventListener("focusout", onLeave);
}

// Public init — idempotent
export function initPortfolioHover() {
  if (_wired) return;
  _wired = true;

  // Cards
  const cards = Array.from(qsa(CARD_SELECTOR));
  if (cards.length) {
    cards.forEach((card) => {
      // Ensure base a11y state
      if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
      card.setAttribute("aria-hidden", "false");
      enhanceCardPreview(card);
    });

    // Pause videos if tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cards.forEach((c) => pauseCardVideo(c, true));
    });
  }

  // Filters (support either container selector)
  const filterContainer = qs(FILTER_CONTAINER_SEL);
  const buttons = filterContainer ? Array.from(filterContainer.querySelectorAll(FILTER_BTN_SEL)) : [];

  if (buttons.length) {
    // Initialize buttons: ensure type=button and roving tabindex
    buttons.forEach((btn) => {
      if (!btn.hasAttribute("type")) btn.type = "button";
      // If markup already marks one active, keep it; else first becomes active
      const isSelected =
        btn.getAttribute("aria-checked") === "true" || btn.getAttribute("aria-selected") === "true";
      btn.tabIndex = isSelected ? 0 : -1;
    });

    // Find initially active or default to first
    const initial =
      buttons.find(
        (b) => b.getAttribute("aria-checked") === "true" || b.getAttribute("aria-selected") === "true"
      ) || buttons[0];

    if (initial) {
      setActiveButton(initial, buttons);
      applyFilter(getFilterValue(initial), cards);
    } else {
      // Fallback: show all
      applyFilter("all", cards);
    }

    // Event delegation for clicks (fast, minimal listeners)
    filterContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest(FILTER_BTN_SEL);
      if (!btn || !filterContainer.contains(btn)) return;

      setActiveButton(btn, buttons);
      applyFilter(getFilterValue(btn), cards);
    });

    // Single keydown handler per button to preserve a11y nav
    buttons.forEach((btn) => {
      btn.addEventListener("keydown", (ev) => handleFilterKeydown(ev, buttons));
    });
  } else {
    // No filters in DOM — ensure default visible + previews still work
    applyFilter("all", cards);
  }
}

export default initPortfolioHover;
