// /scripts/modules/labsGlow.js
// Tiny hover effects and optional demo launch hooks

import { qsa } from "../utils/dom.js";

function addHoverEffects(el) {
  const activate = () => el.classList.add("is-hovered");
  const deactivate = () => el.classList.remove("is-hovered");

  el.addEventListener("mouseenter", activate);
  el.addEventListener("mouseleave", deactivate);
  el.addEventListener("focusin", activate);
  el.addEventListener("focusout", deactivate);
}

function handleDemoClick(event) {
  const demoId = event.currentTarget.dataset.demo;
  if (!demoId) return;
  event.preventDefault();
  console.info(`Launch demo placeholder: ${demoId}`);
}

export function initLabsGlow() {
  qsa(".lab-card").forEach(addHoverEffects);
  qsa("[data-demo]").forEach((btn) => btn.addEventListener("click", handleDemoClick));
}

export default initLabsGlow;
