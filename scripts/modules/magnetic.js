// /scripts/modules/magnetic.js
// Magnetic button/link effect: subtle pull toward cursor

import { qsa, prefersReducedMotion } from "../utils/dom.js";

const MAX_OFFSET_DEFAULT = 1.8;

function clamp(value, max) {
  return Math.max(-max, Math.min(max, value));
}

function attachMagnetic(el) {
  const custom = parseFloat(el.dataset.magneticMax || el.dataset.magnetic || "");
  const maxOffset = Number.isFinite(custom)
    ? Math.min(Math.max(Math.abs(custom), 0.8), 2)
    : MAX_OFFSET_DEFAULT;
  let raf = 0;

  const apply = (clientX, clientY) => {
    const rect = el.getBoundingClientRect();
    const dx = (clientX - (rect.left + rect.width / 2)) / rect.width;
    const dy = (clientY - (rect.top + rect.height / 2)) / rect.height;

    const tx = clamp(dx, 1) * maxOffset;
    const ty = clamp(dy, 1) * maxOffset;

    el.style.setProperty("--magnet-x", `${tx.toFixed(3)}px`);
    el.style.setProperty("--magnet-y", `${ty.toFixed(3)}px`);
  };

  const onPointerMove = (event) => {
    const { clientX, clientY } = event;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => apply(clientX, clientY));
  };

  const reset = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el.style.setProperty("--magnet-x", "0px");
    el.style.setProperty("--magnet-y", "0px");
  };

  el.addEventListener("pointermove", onPointerMove, { passive: true });
  el.addEventListener("pointerleave", reset);
  el.addEventListener("pointercancel", reset);
  el.addEventListener("blur", reset, true);
}

export function initMagnetic() {
  if (prefersReducedMotion()) return;
  qsa("[data-magnetic]").forEach((el) => {
    if (!el.dataset.magneticReady) {
      el.dataset.magneticReady = "1";
      attachMagnetic(el);
    }
  });
}
