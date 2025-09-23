// /scripts/modules/processFlow.js
// SwiftSendMax 1.0 — Sequential highlight for “Process” steps.
// A11y-first & smooth by default. Respects prefers-reduced-motion.
// Starts animating only when the section is in view; pauses on hover/focus.

// Supports both historical markups:
//   Container: .process-steps  (or any element wrapping the steps)
//   Steps:     .step  | .step-card
//
// Behavior:
// - Cycles .is-active across steps while visible
// - Adds data-active="true|false" for CSS hooks
// - Hover/focus pauses the loop and activates that step
// - Leaves fail silently if DOM is missing

import { qs, qsa, prefersReducedMotion } from "../utils/dom.js";

let _wired = false;

const CONTAINER_SEL = ".process-steps, [data-process-steps]";
const STEP_SEL = ".step, .step-card";
const ACTIVE_CLASS = "is-active";
const THRESHOLD = 0.35;
// Default cadence between highlights (ms). Can be overridden via data-interval on container
const DEFAULT_INTERVAL = 3000;

let container = null;
let steps = [];
let current = -1;
let timerId = 0;
let inView = false;
let reduceMotion = false;
let observer = null;

function setActive(idx) {
  if (!steps.length) return;
  current = idx;
  steps.forEach((el, i) => {
    const on = i === current;
    el.classList.toggle(ACTIVE_CLASS, on);
    el.setAttribute("data-active", String(on));
  });
}

function clearTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = 0;
  }
}

function getInterval() {
  if (!container) return DEFAULT_INTERVAL;
  const v = Number(container.getAttribute("data-interval"));
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_INTERVAL;
}

function queueNext() {
  clearTimer();
  if (!inView || reduceMotion || steps.length <= 1) return;
  timerId = window.setTimeout(() => {
    const next = (current + 1) % steps.length;
    setActive(next);
    queueNext();
  }, getInterval());
}

function enterView() {
  if (inView) return;
  inView = true;

  if (!steps.length) return;

  // On first entry, activate the first step.
  if (current < 0) setActive(0);

  if (!reduceMotion) {
    queueNext();
  }
}

function exitView() {
  inView = false;
  clearTimer();
  // Optional: clear active when leaving view for a subtler feel.
  // Keep first item active if reduced motion (stable UI).
  if (!reduceMotion) {
    current = -1;
    steps.forEach((s) => {
      s.classList.remove(ACTIVE_CLASS);
      s.setAttribute("data-active", "false");
    });
  }
}

function bindManualControls() {
  steps.forEach((step, i) => {
    const pauseAndSet = () => {
      if (reduceMotion) return;
      clearTimer();
      setActive(i);
    };
    const resume = () => {
      if (reduceMotion || !inView) return;
      queueNext();
    };

    step.addEventListener("mouseenter", pauseAndSet);
    step.addEventListener("focusin", pauseAndSet);
    step.addEventListener("mouseleave", resume);
    step.addEventListener("focusout", resume);
  });
}

function setupObserver() {
  if (!container) return;
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target !== container) continue;
        if (entry.isIntersecting) enterView();
        else exitView();
      }
    },
    { threshold: THRESHOLD }
  );
  observer.observe(container);
}

export function initProcessFlow() {
  if (_wired) return;
  _wired = true;

  // Find container: prefer an explicit wrapper; else infer from first step’s parent.
  container = qs(CONTAINER_SEL);
  steps = qsa(STEP_SEL, container || document);

  if (!steps.length) return;

  // If no explicit container, use the closest shared parent of the first step.
  if (!container) {
    container = steps[0].closest(".process-steps") || steps[0].parentElement;
  }

  reduceMotion = prefersReducedMotion();

  // Base state
  steps.forEach((s) => {
    s.classList.remove(ACTIVE_CLASS);
    s.setAttribute("data-active", "false");
  });

  // Always bind manual controls; they’re no-ops for reduced motion except direct activation.
  bindManualControls();

  if (reduceMotion) {
    // Stable, non-animated state for users preferring reduced motion.
    setActive(0);
    return;
  }

  setupObserver();

  // Safety: if IntersectionObserver isn’t supported, start loop immediately.
  if (!("IntersectionObserver" in window)) {
    inView = true;
    setActive(0);
    queueNext();
  }

  // Pause when tab is hidden; resume on show.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimer();
    } else if (inView && !reduceMotion) {
      queueNext();
    }
  });
}

export default initProcessFlow;
