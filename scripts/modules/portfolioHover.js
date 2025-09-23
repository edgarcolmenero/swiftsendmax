// /scripts/modules/portfolioHover.js
// Work cards filtering + hover-play videos

import { qsa, prefersReducedMotion } from "../utils/dom.js";

const reduceMotion = () => prefersReducedMotion();

function handleFilterClick(e) {
  const btn = e.currentTarget;
  const category = (btn.dataset.filter || btn.dataset.category || "all").toLowerCase();

  const siblings = qsa(".filters [role='tab']");
  siblings.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));

  qsa(".work-card").forEach((card) => {
    const raw = (card.dataset.category || card.dataset.tags || "").toLowerCase();
    const tags = raw.split(/\s+/).filter(Boolean);
    const match = category === "all" || tags.includes(category);
    card.classList.toggle("is-hidden", !match);
  });
}

function enableVideoHover(card) {
  const video = card.querySelector("video[data-hover-video]");
  if (!video) return;

  const motionReduced = reduceMotion();
  let loaded = false;

  const prepare = () => {
    if (loaded) return;
    const src = video.dataset.hoverVideo;
    if (!src) return;
    video.src = src;
    video.load();
    loaded = true;
  };

  const play = () => {
    if (motionReduced) return;
    prepare();
    if (!loaded) return;
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  const stop = () => {
    if (!loaded) return;
    video.pause();
    video.currentTime = 0;
  };

  card.addEventListener("pointerenter", play);
  card.addEventListener("focusin", play);
  card.addEventListener("pointerleave", stop);
  card.addEventListener("pointercancel", stop);
  card.addEventListener("focusout", stop);
}

export function initPortfolioHover() {
  qsa(".filters [data-filter], .filters [data-category]").forEach((btn) =>
    btn.addEventListener("click", handleFilterClick)
  );

  qsa(".work-card").forEach(enableVideoHover);
}
