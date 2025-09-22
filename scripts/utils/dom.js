// /js/utils/dom.js
// Utility DOM helpers and motion checks

// Query selector shortcuts
export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Class helpers
export const addClass = (el, cls) => el && el.classList.add(cls);
export const removeClass = (el, cls) => el && el.classList.remove(cls);
export const toggleClass = (el, cls, force) => el && el.classList.toggle(cls, force);

// Throttle with requestAnimationFrame
export const rafQueue = (fn) => {
  let scheduled = false;
  return (...args) => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        fn(...args);
        scheduled = false;
      });
    }
  };
};

// Throttle by time
export const throttle = (fn, limit = 200) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Motion preference check
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// In-viewport check
export const inViewport = (el, offset = 0) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
    rect.bottom >= 0 + offset
  );
};
