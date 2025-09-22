// /scripts/modules/motion.js
// Motion utilities: reveal animations and scroll-driven class toggles

import { qsa } from "../utils/dom.js";
import { observeReveal } from "../utils/observe.js";

function revealElement(el) {
  el.classList.add("is-revealed");
}

export function initMotion() {
  // Reveal any element with [data-reveal]
  qsa("[data-reveal]").forEach((el) => {
    observeReveal(el, revealElement);
  });

  // Scroll-driven motion hooks
  qsa("[data-motion]").forEach((el) => {
    const cls = el.dataset.motion;
    observeReveal(el, () => el.classList.add(cls));
  });
}
