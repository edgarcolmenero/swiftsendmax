// /scripts/modules/underline.js
// SwiftSendMax 1.0 — Sequential underline animation for links.
// Merged behavior:
//  - Normalizes markup so [data-underline] and .u-underline share the same CSS hook.
//  - Adds a subtle pointer-origin effect via CSS var --underline-origin.
//  - Idempotent, minimal listeners, a11y-friendly fallbacks.

import { qsa } from "../utils/dom.js";

const SELECTOR = "[data-underline], .u-underline";
let _wired = false;

function normalizeLink(link, order) {
  // Ensure common class hook
  if (!link.classList.contains("u-underline")) {
    link.classList.add("u-underline");
  }
  // Provide a stable order for staggered effects, if author didn't set it
  if (!link.style.getPropertyValue("--underline-order")) {
    link.style.setProperty("--underline-order", String(order));
  }
}

function attachPointerOrigin(link) {
  if (link.dataset.underlineReady === "true") return;

  const updateFromEvent = (ev) => {
    const rect = link.getBoundingClientRect();
    const x = ev.clientX ?? (ev.touches && ev.touches[0]?.clientX);
    if (typeof x !== "number" || !rect.width) return;
    const ratio = (x - rect.left) / rect.width;
    // Clamp 0..1 and keep a few decimals for smoothness
    const clamped = Math.min(1, Math.max(0, ratio));
    link.style.setProperty("--underline-origin", clamped.toFixed(3));
  };

  const centerOrigin = () => {
    link.style.setProperty("--underline-origin", "0.5");
  };

  const resetOrigin = () => {
    link.style.removeProperty("--underline-origin");
  };

  // Pointer/hover interactions (no preventDefault -> passive is fine)
  link.addEventListener("pointermove", updateFromEvent, { passive: true });
  link.addEventListener("pointerenter", centerOrigin, { passive: true });
  link.addEventListener("pointerleave", resetOrigin, { passive: true });
  // Touch fallback: center on touchstart, then reset after touchend
  link.addEventListener("touchstart", centerOrigin, { passive: true });
  link.addEventListener("touchend", resetOrigin, { passive: true });
  // Keyboard a11y: center on focus, reset on blur
  link.addEventListener("focus", centerOrigin, { passive: true });
  link.addEventListener("blur", resetOrigin, { passive: true });

  link.dataset.underlineReady = "true";
}

export function initUnderline() {
  if (_wired) return;
  _wired = true;

  const links = qsa(SELECTOR);
  if (!links.length) return;

  links.forEach((link, idx) => {
    normalizeLink(link, idx);
    attachPointerOrigin(link);
  });
}

export default initUnderline;
