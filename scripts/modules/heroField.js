// /scripts/modules/heroField.js
// Light parallax for hero section: updates --px/--py on .hero.is-parallax
// Disabled if prefers-reduced-motion is set

import { prefersReducedMotion, rafQueue } from "../utils/dom.js";

let heroEl;
let detachHandlers;

function updateParallax(x = 0, y = 0) {
  if (!heroEl) return;
  heroEl.style.setProperty("--px", x.toFixed(3));
  heroEl.style.setProperty("--py", y.toFixed(3));
}

function initMouseParallax() {
  const handleMove = rafQueue((event) => {
    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 2; // -1 to 1
    const y = (event.clientY / innerHeight - 0.5) * 2;
    updateParallax(x, y);
  });

  const reset = () => updateParallax(0, 0);

  window.addEventListener("mousemove", handleMove);
  window.addEventListener("mouseout", reset);

  detachHandlers = () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseout", reset);
  };
}

function initScrollParallax() {
  const handleScroll = rafQueue(() => {
    const rect = heroEl.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const relativeY = (midpoint - window.innerHeight / 2) / window.innerHeight;
    updateParallax(0, relativeY);
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  detachHandlers = () => {
    window.removeEventListener("scroll", handleScroll);
  };
}

export function initHeroField() {
  heroEl = document.querySelector(".hero.is-parallax");
  if (!heroEl || prefersReducedMotion()) return;

  if (window.matchMedia("(pointer: fine)").matches) {
    initMouseParallax();
  } else {
    initScrollParallax();
  }
}

export function destroyHeroField() {
  if (typeof detachHandlers === "function") {
    detachHandlers();
  }
  heroEl = null;
}

export default initHeroField;
