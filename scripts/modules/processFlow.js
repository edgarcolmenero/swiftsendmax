// /scripts/modules/processFlow.js
// Optional step counters/auto-sequence sync

import { qsa, addClass, removeClass } from "../utils/dom.js";

let steps = [];
let current = 0;
let timer;

function activateStep(index) {
  steps.forEach((step, i) => {
    if (i === index) addClass(step, "is-active");
    else removeClass(step, "is-active");
  });
}

function autoSequence(interval = 4000) {
  if (!steps.length) return;
  clearInterval(timer);
  timer = setInterval(() => {
    current = (current + 1) % steps.length;
    activateStep(current);
  }, interval);
}

export function initProcessFlow() {
  steps = qsa(".process-step");
  if (!steps.length) return;

  activateStep(0);
  autoSequence();

  // Allow manual hover/focus override
  steps.forEach((step, i) => {
    step.addEventListener("mouseenter", () => {
      clearInterval(timer);
      activateStep(i);
    });
    step.addEventListener("mouseleave", () => autoSequence());
    step.addEventListener("focusin", () => {
      clearInterval(timer);
      activateStep(i);
    });
    step.addEventListener("focusout", () => autoSequence());
  });
}
