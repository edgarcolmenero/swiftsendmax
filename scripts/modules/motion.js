// /scripts/modules/motion.js
// Motion utilities: reveal animations and scroll-driven class toggles

import { qsa } from "../utils/dom.js";
import { onEnter } from "../utils/observe.js";

export function initMotion() {
  qsa("[data-motion]").forEach((el) => {
    const motionClass = el.dataset.motion;
    onEnter(
      el,
      () => {
        if (motionClass) {
          el.classList.add(motionClass);
        }
        el.classList.add("is-motion-active");
      },
      { once: true }
    );
  });
}

export default initMotion;
