// /scripts/modules/underline.js
// Sequential underline animation for links.
// Normalises markup so both [data-underline] and .u-underline share the same CSS hook.

import { qsa } from "../utils/dom.js";

const SELECTOR = "[data-underline], .u-underline";

export function initUnderline() {
  qsa(SELECTOR).forEach((link, index) => {
    if (!link.classList.contains("u-underline")) {
      link.classList.add("u-underline");
    }

    if (!link.style.getPropertyValue("--underline-order")) {
      link.style.setProperty("--underline-order", String(index));
    }
  });
}
