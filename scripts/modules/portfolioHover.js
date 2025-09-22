// /scripts/modules/portfolioHover.js
// Portfolio filters + hover/focus video previews with keyboard support.

import { qs, qsa } from "../utils/dom.js";

const FILTER_SELECTOR = ".work-filter [data-filter]";
const CARD_SELECTOR = ".work-card";
const GRID_SELECTOR = "[data-portfolio-grid]";
const TRANSITION_FALLBACK_MS = 280;

const cardControls = new WeakMap();
const hideHandlers = new WeakMap();
const hideTimers = new WeakMap();
let heightResetTimer = null;

function parseTags(card) {
  return card.dataset.tags ? card.dataset.tags.split(/\s+/).filter(Boolean) : [];
}

function stopVideo(card, reset = false) {
  const controls = cardControls.get(card);
  if (!controls || typeof controls.pause !== "function") return;
  controls.pause(reset);
}

function enableVideoHover(card) {
  const video = card.querySelector(".work-card__video");
  if (!video) return null;

  const loadVideo = () => {
    if (video.dataset.hoverLoaded === "true") return;
    const src = video.dataset.hoverSrc || video.dataset.hoverVideo;
    if (src && !video.src) {
      video.src = src;
      video.dataset.hoverLoaded = "true";
    }
  };

  const attemptPlay = () => {
    loadVideo();
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const pause = (resetTime = false) => {
    video.pause();
    if (resetTime) {
      try {
        video.currentTime = 0;
      } catch (err) {
        /* no-op */
      }
    }
  };

  const handleEnter = () => attemptPlay();
  const handleLeave = () => pause(false);

  card.addEventListener("mouseenter", handleEnter);
  card.addEventListener("focusin", handleEnter);
  card.addEventListener("mouseleave", handleLeave);
  card.addEventListener("focusout", handleLeave);

  return {
    pause,
  };
}

function lockGridHeight(grid) {
  if (!grid) return () => {};
  const currentHeight = grid.offsetHeight;
  grid.style.minHeight = `${currentHeight}px`;
  if (heightResetTimer) {
    window.clearTimeout(heightResetTimer);
  }
  return () => {
    heightResetTimer = window.setTimeout(() => {
      grid.style.minHeight = "";
    }, TRANSITION_FALLBACK_MS + 80);
  };
}

function showCard(card) {
  const pendingHandler = hideHandlers.get(card);
  if (pendingHandler) {
    card.removeEventListener("transitionend", pendingHandler);
    hideHandlers.delete(card);
  }

  const pendingTimer = hideTimers.get(card);
  if (pendingTimer) {
    window.clearTimeout(pendingTimer);
    hideTimers.delete(card);
  }

  card.classList.remove("is-hidden", "is-fading-out");
  card.setAttribute("aria-hidden", "false");
  card.tabIndex = 0;
  card.classList.add("is-activating");
  requestAnimationFrame(() => {
    card.classList.remove("is-activating");
  });
}

function hideCard(card) {
  if (card.classList.contains("is-hidden")) return;
  card.classList.add("is-fading-out");
  card.setAttribute("aria-hidden", "true");
  card.tabIndex = -1;
  card.classList.remove("is-activating");

  const finish = () => {
    card.classList.add("is-hidden");
    card.classList.remove("is-fading-out");
    hideHandlers.delete(card);
    const timer = hideTimers.get(card);
    if (timer) {
      window.clearTimeout(timer);
      hideTimers.delete(card);
    }
  };

  let completed = false;
  const handle = (event) => {
    if (event.propertyName !== "opacity") return;
    completed = true;
    card.removeEventListener("transitionend", handle);
    finish();
  };

  card.addEventListener("transitionend", handle);
  hideHandlers.set(card, handle);

  const timeoutId = window.setTimeout(() => {
    if (completed) return;
    card.removeEventListener("transitionend", handle);
    finish();
  }, TRANSITION_FALLBACK_MS);
  hideTimers.set(card, timeoutId);
}

function applyFilter(category, cards, grid) {
  const releaseHeight = lockGridHeight(grid);
  const activeFilter = category.toLowerCase();

  cards.forEach((card) => {
    const tags = parseTags(card);
    const matches = activeFilter === "all" || tags.includes(activeFilter);
    if (matches) {
      showCard(card);
    } else {
      stopVideo(card, true);
      hideCard(card);
    }
  });

  releaseHeight();
}

function setActiveButton(activeBtn, buttons) {
  buttons.forEach((btn) => {
    const isActive = btn === activeBtn;
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.classList.toggle("is-active", isActive);
    btn.tabIndex = isActive ? 0 : -1;
  });
}

function handleFilterKeydown(event, buttons) {
  const { key } = event;
  const currentIndex = buttons.indexOf(event.currentTarget);

  if (key === "ArrowRight" || key === "ArrowDown") {
    event.preventDefault();
    const next = buttons[(currentIndex + 1) % buttons.length];
    next.focus();
    next.click();
    return;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    event.preventDefault();
    const next = buttons[(currentIndex - 1 + buttons.length) % buttons.length];
    next.focus();
    next.click();
    return;
  }

  if (key === "Home") {
    event.preventDefault();
    const first = buttons[0];
    first.focus();
    first.click();
    return;
  }

  if (key === "End") {
    event.preventDefault();
    const last = buttons[buttons.length - 1];
    last.focus();
    last.click();
    return;
  }

  if (key === " " || key === "Enter") {
    event.preventDefault();
    event.currentTarget.click();
  }
}

export function initPortfolioHover() {
  const buttons = Array.from(qsa(FILTER_SELECTOR));
  const cards = Array.from(qsa(CARD_SELECTOR));
  const grid = qs(GRID_SELECTOR);

  if (!cards.length) return;

  cards.forEach((card) => {
    if (!card.hasAttribute("tabindex")) {
      card.tabIndex = 0;
    }
    card.setAttribute("aria-hidden", "false");
    const controls = enableVideoHover(card);
    if (controls) {
      cardControls.set(card, controls);
    }
  });

  if (!buttons.length) {
    return;
  }

  buttons.forEach((btn) => {
    if (!btn.hasAttribute("type")) {
      btn.type = "button";
    }
    btn.tabIndex = btn.getAttribute("aria-selected") === "true" ? 0 : -1;
    btn.addEventListener("click", () => {
      setActiveButton(btn, buttons);
      applyFilter(btn.dataset.filter || "all", cards, grid);
    });
    btn.addEventListener("keydown", (event) => handleFilterKeydown(event, buttons));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cards.forEach((card) => stopVideo(card, true));
    }
  });

  // Ensure the initial filter state is applied to match the default aria-selected button.
  const initiallyActive = buttons.find((btn) => btn.getAttribute("aria-selected") === "true") || buttons[0];
  if (initiallyActive) {
    setActiveButton(initiallyActive, buttons);
    applyFilter(initiallyActive.dataset.filter || "all", cards, grid);
  }
}
