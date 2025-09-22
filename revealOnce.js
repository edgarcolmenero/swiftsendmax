// revealOnce.js
// Attribute-driven reveal with zero CSS dependency (adds inline transitions as fallback).
// Works out-of-the-box on elements with [data-reveal], optional:
//   data-reveal="fade|slide-up|scale-in" (default: slide-up)
//   data-reveal-delay="120"  (ms)
//   data-reveal-stagger="80" (ms; if element is a container, children must have [data-reveal-child])
// Respects reduced motion: reveals immediately.

import { onEnterBatch } from './utils/observe.js';

const SELECTOR = '[data-reveal]';
const CHILD_SELECTOR = '[data-reveal-child]';
const DEFAULT_KIND = 'slide-up';

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const BASE_MS = 600;

function applyInitStyles(el, kind) {
  // Guard double-init
  if (el.dataset.revealInit === '1') return;
  el.dataset.revealInit = '1';

  el.style.willChange = 'opacity, transform';
  el.style.opacity = '0';

  switch (kind) {
    case 'fade':
      el.style.transform = 'none';
      break;
    case 'scale-in':
      el.style.transform = 'scale(.98)';
      break;
    case 'slide-up':
    default:
      el.style.transform = 'translateY(18px)';
      break;
  }
}

function revealWithTransition(el, delay = 0) {
  // If user prefers reduced motion, show instantly
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.transition = 'none';
    el.removeAttribute('data-reveal'); // considered done
    return;
  }

  // Transition
  el.style.transition = `opacity ${BASE_MS}ms ${EASE} ${delay}ms, transform ${BASE_MS}ms ${EASE} ${delay}ms`;

  // Force next frame before toggling
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  // Cleanup inline styles after transition ends to avoid interfering with your CSS
  const cleanup = () => {
    el.style.willChange = '';
    el.style.transition = '';
    el.removeEventListener('transitionend', cleanup);
    // Keep opacity/transform cleared (visible)
  };
  el.addEventListener('transitionend', cleanup, { once: true });
  el.removeAttribute('data-reveal'); // mark complete
}

function initIndividual(els) {
  els.forEach((el) => {
    const kind = (el.getAttribute('data-reveal') || DEFAULT_KIND).trim();
    applyInitStyles(el, kind);
  });

  onEnterBatch(els, (entry) => {
    const el = entry.target;
    const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10) || 0;
    revealWithTransition(el, delay);
  });
}

function initStaggered(containers) {
  containers.forEach((container) => {
    const childEls = container.querySelectorAll(CHILD_SELECTOR);
    if (!childEls.length) return;

    const baseDelay = parseInt(container.getAttribute('data-reveal-delay') || '0', 10) || 0;
    const step = parseInt(container.getAttribute('data-reveal-stagger') || '60', 10) || 60;

    // Initialize children
    childEls.forEach((el, idx) => {
      const kind = (el.getAttribute('data-reveal') || DEFAULT_KIND).trim();
      applyInitStyles(el, kind);
      // Store computed delay for later
      el.dataset._revealDelay = String(baseDelay + idx * step);
    });

    // Observe the container once, reveal kids in sequence
    onEnterBatch([container], () => {
      childEls.forEach((el) => {
        const d = parseInt(el.dataset._revealDelay || '0', 10) || 0;
        revealWithTransition(el, d);
      });
      container.removeAttribute('data-reveal-stagger');
    }, { once: true });
  });
}

export function initRevealOnce() {
  const all = Array.from(document.querySelectorAll(SELECTOR));
  if (!all.length) return;

  // Containers that manage stagger for children
  const staggerContainers = all.filter((el) => el.hasAttribute('data-reveal-stagger'));
  const individuals = all.filter((el) => !el.hasAttribute('data-reveal-stagger'));

  // Initialize both paths
  if (individuals.length) initIndividual(individuals);
  if (staggerContainers.length) initStaggered(staggerContainers);
}

// Auto-init if imported as a side-effect (optional; main.js calls it explicitly too)
if (typeof window !== 'undefined') {
  // Do not auto-run to avoid double init; main.js orchestrates order.
}

export default initRevealOnce;
