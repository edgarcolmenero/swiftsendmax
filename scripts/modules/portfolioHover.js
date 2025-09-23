// /scripts/modules/portfolioHover.js
// Work cards filtering + hover-play videos

import { qsa } from "../utils/dom.js";

function applyFilter(category) {
  const cards = qsa(".work-card");
  cards.forEach((card) => {
    const tags = (card.dataset.tags || "").split(/\s+/);
    const match = category === "all" || tags.includes(category);
    card.classList.toggle("is-hidden", !match);
    card.setAttribute("aria-hidden", String(!match));
  });
}

function handleFilterClick(event) {
  const btn = event.currentTarget;
  const category = btn.dataset.filter || "all";

  qsa(".work__filters [role='tab']").forEach((chip) => {
    const isActive = chip === btn;
    chip.setAttribute("aria-selected", String(isActive));
    chip.classList.toggle("is-active", isActive);
  });

  applyFilter(category);
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
    video.play().catch(() => {});
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
  qsa(".work__filters [data-filter]").forEach((btn) => {
    btn.addEventListener("click", handleFilterClick);
  });

  applyFilter("all");
  qsa(".work-card").forEach(enhanceVideo);
}

export default initPortfolioHover;
