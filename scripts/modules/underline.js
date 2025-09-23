// /scripts/modules/underline.js
// Sequential underline animation for links with [data-underline]

import { qsa } from "../utils/dom.js";

function attachUnderline(link) {
  const handleMove = (event) => {
    const rect = link.getBoundingClientRect();
    const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0.5;
    link.style.setProperty("--underline-origin", Math.min(Math.max(ratio, 0), 1).toFixed(3));
  };

  const reset = () => {
    link.style.removeProperty("--underline-origin");
  };

  link.dataset.underlineReady = "true";
  link.addEventListener("pointermove", handleMove);
  link.addEventListener("pointerleave", reset);
  link.addEventListener("blur", reset);
}

export function initUnderline() {
  qsa("[data-underline]").forEach((link) => attachUnderline(link));
}

export default initUnderline;
