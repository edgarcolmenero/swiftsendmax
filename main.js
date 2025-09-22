// scripts/main.js
// Ensures reveal/visibility runs first, then loads the rest in a safe order.
// Works whether your modules export default or a named init* function.

import initRevealOnce from './modules/revealOnce.js';

// Optional: if you have a header spacer or measurements, ensure header init runs early
// import { initHeader } from './modules/header.js';

const MODULES = [
  // [path, init name (optional)]
  ['./modules/header.js', 'initHeader'],
  ['./modules/forms.js', 'initForms'],
  ['./modules/heroField.js', 'initHeroField'],
  ['./modules/labsGlow.js', 'initLabsGlow'],
  ['./modules/magnetic.js', 'initMagnetic'],
  ['./modules/portfolioHover.js', 'initPortfolioHover'],
  ['./modules/processFlow.js', 'initProcessFlow'],
  ['./modules/revealOnce.js', 'initRevealOnce'], // idempotent; safe to call again
  ['./modules/savingsEstimator.js', 'initSavingsEstimator'],
  ['./modules/underline.js', 'initUnderline'],
  ['./modules/motion.js', 'initMotion'],
  ['./utils/dom.js', null],       // utilities (no init)
  ['./utils/observe.js', null],   // utilities (no init)
];

function callMaybe(mod, initName) {
  try {
    if (!mod) return;
    if (initName && typeof mod[initName] === 'function') {
      mod[initName]();
      return;
    }
    if (typeof mod.default === 'function') {
      mod.default();
    }
  } catch (err) {
    console.error(`[main] Module init failed (${initName ?? 'default'}):`, err);
  }
}

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true, passive: true });
  } else {
    fn();
  }
}

ready(async () => {
  console.log('[main] booting…');

  // 1) Make sure anything hidden by reveal is initialized immediately.
  try {
    initRevealOnce();
    console.log('[main] revealOnce initialized');
  } catch (e) {
    console.error('[main] reveal init error:', e);
  }

  // 2) Load/boot the rest after reveal init.
  await Promise.all(
    MODULES.map(async ([path, initName]) => {
      try {
        const mod = await import(/* @vite-ignore */ path);
        callMaybe(mod, initName);
        console.log(`[main] init ok -> ${path}${initName ? `:${initName}` : ''}`);
      } catch (err) {
        console.warn(`[main] Skipped ${path}:`, err?.message || err);
      }
    })
  );

  console.log('[main] boot complete');
});
