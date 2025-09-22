// /scripts/modules/portfolioHover.js
// Work cards filtering + hover-play videos

import { qs, qsa } from "../utils/dom.js";

function handleFilterClick(e) {
  const btn = e.currentTarget;
  const category = btn.dataset.category;

  // Toggle aria-pressed
  qsa(".work-filter [aria-pressed]").forEach((b) =>
    b.setAttribute("aria-pressed", "false")
  );
  btn.setAttribute("aria-pressed", "true");

  // Show/hide cards
  qsa(".work-card").forEach((card) => {
    const match = category === "all" || card.dataset.category === category;
    card.classList.toggle("is-hidden", !match);
  });
}

function enableVideoHover(card) {
  const video = card.querySelector("video");
  if (!video) return;

  const play = () => {
    video.play().catch(() => {});
  };
  const pause = () => video.pause();

  card.addEventListener("mouseenter", play);
  card.addEventListener("focusin", play);
  card.addEventListener("mouseleave", pause);
  card.addEventListener("focusout", pause);
}

export function initPortfolioHover() {
  // Filter chips
  qsa(".work-filter [data-category]").forEach((btn) =>
    btn.addEventListener("click", handleFilterClick)
  );

  // Hover-play videos
  qsa(".work-card").forEach(enableVideoHover);
}
