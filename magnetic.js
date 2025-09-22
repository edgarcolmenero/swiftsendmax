// /scripts/modules/magnetic.js
// Magnetic button/link effect: subtle pull toward cursor

import { qsa, prefersReducedMotion } from "../utils/dom.js";

function attachMagnetic(el) {
  const strength = parseFloat(el.dataset.magnetic) || 0.3;
  const rect = () => el.getBoundingClientRect();

  function onMouseMove(e) {
    const r = rect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }

  function reset() {
    el.style.transform = "";
  }

  el.addEventListener("mousemove", onMouseMove);
  el.addEventListener("mouseleave", reset);
}

export function initMagnetic() {
  if (prefersReducedMotion()) return;
  qsa("[data-magnetic]").forEach(attachMagnetic);
}
