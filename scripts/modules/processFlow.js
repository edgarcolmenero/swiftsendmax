// /scripts/modules/processFlow.js
// Sequential highlight for process steps when visible.

import { qsa, prefersReducedMotion } from "../utils/dom.js";

const STEP_SELECTOR = ".process-steps .step";
const ACTIVE_CLASS = "is-active";
const STEP_INTERVAL = 2400;

let steps = [];
let index = -1;
let timer = 0;
let inView = false;
let reduceMotion = false;

function highlightStep(nextIndex) {
  index = nextIndex;
  steps.forEach((step, i) => {
    step.classList.toggle(ACTIVE_CLASS, i === index);
  });
}

function clearSequence(reset = false) {
  if (timer) {
    clearTimeout(timer);
    timer = 0;
  }
  if (reset) {
    index = -1;
    steps.forEach((step) => step.classList.remove(ACTIVE_CLASS));
  }
}

function queueNext() {
  clearSequence();
  if (!inView || reduceMotion || steps.length <= 1) return;
  timer = window.setTimeout(() => {
    const next = (index + 1) % steps.length;
    highlightStep(next);
    queueNext();
  }, STEP_INTERVAL);
}

function handleEnterView() {
  if (inView) return;
  inView = true;
  if (!steps.length) return;

  if (reduceMotion) {
    highlightStep(0);
    return;
  }

  highlightStep(0);
  queueNext();
}

function handleExitView() {
  inView = false;
  clearSequence(true);
}

function attachManualControls() {
  steps.forEach((step, i) => {
    step.addEventListener("mouseenter", () => {
      if (reduceMotion) return;
      clearSequence();
      highlightStep(i);
    });
    step.addEventListener("mouseleave", () => {
      if (reduceMotion || !inView) return;
      queueNext();
    });
    step.addEventListener("focusin", () => {
      if (reduceMotion) return;
      clearSequence();
      highlightStep(i);
    });
    step.addEventListener("focusout", () => {
      if (reduceMotion || !inView) return;
      queueNext();
    });
  });
}

export function initProcessFlow() {
  steps = qsa(STEP_SELECTOR);
  if (!steps.length) return;

  reduceMotion = prefersReducedMotion();

  if (reduceMotion) {
    highlightStep(0);
    return;
  }

  attachManualControls();

  const container = steps[0].closest(".process-steps");
  if (!container) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        handleEnterView();
      } else {
        handleExitView();
      }
    });
  }, { threshold: 0.35 });

  observer.observe(container);
}
