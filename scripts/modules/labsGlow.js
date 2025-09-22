// /scripts/modules/labsGlow.js
// Tiny hover effects and optional demo launch hooks

import { qsa } from "../utils/dom.js";

function addHoverEffects(el) {
  el.addEventListener("mouseenter", () => {
    el.classList.add("is-hovered");
  });
  el.addEventListener("mouseleave", () => {
    el.classList.remove("is-hovered");
  });
}

// Optional quick demo launch
function handleDemoClick(e) {
  const demoId = e.currentTarget.dataset.demo;
  if (!demoId) return;

  // Placeholder for demo launch logic
  console.log(`Launch demo: ${demoId}`);
}

export function initLabsGlow() {
  // Hover effects
  qsa(".labs-card").forEach(addHoverEffects);

  // Demo launch buttons
  qsa("[data-demo]").forEach((btn) =>
    btn.addEventListener("click", handleDemoClick)
  );
}
