// /scripts/modules/processFlow.js
// Step cards sequential lighting with optional hover overrides

import { qsa } from "../utils/dom.js";

let steps = [];
let index = 0;
let timerId;
const INTERVAL = 4500;

function activate(idx) {
  steps.forEach((step, i) => {
    const isActive = i === idx;
    step.classList.toggle("is-active", isActive);
    step.setAttribute("data-active", String(isActive));
  });
  index = idx;
}

function startLoop() {
  clearInterval(timerId);
  if (!steps.length) return;
  timerId = setInterval(() => {
    const next = (index + 1) % steps.length;
    activate(next);
  }, INTERVAL);
}

function bindInteractions(step, idx) {
  step.addEventListener("mouseenter", () => {
    clearInterval(timerId);
    activate(idx);
  });
  step.addEventListener("focusin", () => {
    clearInterval(timerId);
    activate(idx);
  });
  step.addEventListener("mouseleave", startLoop);
  step.addEventListener("focusout", startLoop);
}

export function initProcessFlow() {
  steps = qsa(".step-card");
  if (!steps.length) return;

  steps.forEach(bindInteractions);
  activate(0);
  startLoop();
}

export default initProcessFlow;
