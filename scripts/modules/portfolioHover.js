// /scripts/modules/portfolioHover.js
// Work cards filtering + hover-play videos

import { qsa, prefersReducedMotion } from "../utils/dom.js";

const FILTER_SELECTOR = ".work__filters [role='radio']";

function applyFilter(category) {
  const cards = qsa(".work-card");
  cards.forEach((card) => {
    const tags = (card.dataset.tags || "").split(/\s+/);
    const match = category === "all" || tags.includes(category);
    card.classList.toggle("is-hidden", !match);
    card.setAttribute("aria-hidden", String(!match));
    card.toggleAttribute("hidden", !match);

    if (!match) {
      const video = card.querySelector("video");
      if (video) {
        video.pause();
      }
    }
  });
}

function handleFilterClick(event) {
  const btn = event.currentTarget;
  const category = btn.dataset.filter || "all";

  qsa(FILTER_SELECTOR).forEach((chip) => {
    const isActive = chip === btn;
    chip.setAttribute("aria-checked", String(isActive));
    chip.classList.toggle("is-active", isActive);
  });

  applyFilter(category);
}

function handleFilterKeydown(event) {
  const { key } = event;
  const radios = qsa(FILTER_SELECTOR);
  const index = radios.indexOf(event.currentTarget);
  if (index < 0) return;

  let nextIndex = index;
  if (key === "ArrowRight" || key === "ArrowDown") {
    nextIndex = (index + 1) % radios.length;
  } else if (key === "ArrowLeft" || key === "ArrowUp") {
    nextIndex = (index - 1 + radios.length) % radios.length;
  } else if (key === "Home") {
    nextIndex = 0;
  } else if (key === "End") {
    nextIndex = radios.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  const target = radios[nextIndex];
  target?.focus();
  target?.click();
}

function enhanceVideo(card) {
  const video = card.querySelector("video");
  if (!video) return;

  const source = video.dataset.hoverVideo;
  let loaded = false;

  const ensureSource = () => {
    if (!loaded && source) {
      video.src = source;
      loaded = true;
    }
  };

  const play = () => {
    ensureSource();
    video.currentTime = 0;
    if (!prefersReducedMotion()) {
      video.play().catch(() => {});
    }
  };

  const pause = () => {
    video.pause();
  };

  card.addEventListener("mouseenter", play);
  card.addEventListener("focusin", play);
  card.addEventListener("mouseleave", pause);
  card.addEventListener("focusout", pause);
}

export function initPortfolioHover() {
  qsa(FILTER_SELECTOR).forEach((btn) => {
    btn.addEventListener("click", handleFilterClick);
    btn.addEventListener("keydown", handleFilterKeydown);
  });

  applyFilter("all");
  qsa(".work-card").forEach(enhanceVideo);
}

export default initPortfolioHover;
