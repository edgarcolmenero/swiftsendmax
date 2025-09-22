// /scripts/modules/heroField.js
// Light parallax for hero section: updates --px/--py on .hero.is-parallax
// Disabled if prefers-reduced-motion is set

import { prefersReducedMotion, rafQueue } from "../utils/dom.js";

let heroEl;
let handleMove;

function updateParallax(x, y) {
  if (!heroEl) return;
  heroEl.style.setProperty("--px", x.toFixed(3));
  heroEl.style.setProperty("--py", y.toFixed(3));
}

function onMouseMove(e) {
  const { innerWidth, innerHeight } = window;
  const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
  const y = (e.clientY / innerHeight - 0.5) * 2;
  updateParallax(x, y);
}

function onScroll() {
  const rect = heroEl.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const relY = (midY - window.innerHeight / 2) / window.innerHeight;
  updateParallax(0, relY);
}

export function initHeroField() {
  heroEl = document.querySelector(".hero.is-parallax");
  if (!heroEl || prefersReducedMotion()) return;

  // Desktop: mousemove parallax
  if (window.matchMedia("(pointer:fine)").matches) {
    handleMove = rafQueue(onMouseMove);
    window.addEventListener("mousemove", handleMove);
  } else {
    // Mobile / coarse: scroll-based parallax
    handleMove = rafQueue(onScroll);
    window.addEventListener("scroll", handleMove);
  }
}
