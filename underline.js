// /scripts/modules/underline.js
// Sequential underline animation for links with .u-underline

import { qsa } from "../utils/dom.js";

function addUnderlineEffect(link) {
  const span = document.createElement("span");
  span.className = "u-underline__line";
  link.appendChild(span);

  link.addEventListener("mouseenter", () => {
    span.classList.add("is-active");
  });
  link.addEventListener("mouseleave", () => {
    span.classList.remove("is-active");
  });
  link.addEventListener("focusin", () => {
    span.classList.add("is-active");
  });
  link.addEventListener("focusout", () => {
    span.classList.remove("is-active");
  });
}

export function initUnderline() {
  qsa(".u-underline").forEach((link) => {
    if (!link.querySelector(".u-underline__line")) {
      addUnderlineEffect(link);
    }
  });
}
