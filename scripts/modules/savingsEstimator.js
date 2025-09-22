// /scripts/modules/savingsEstimator.js
// Savings Estimator logic: sliders + pills update computed monthly/yearly savings

import { qs, qsa } from "../utils/dom.js";

function updateValues() {
  const sliders = qsa(".estimator [type='range']");
  const pills = qsa(".estimator [data-value]");

  let base = 0;

  sliders.forEach((slider) => {
    base += parseInt(slider.value, 10) || 0;
  });

  pills.forEach((pill) => {
    if (pill.getAttribute("aria-pressed") === "true") {
      base += parseInt(pill.dataset.value, 10) || 0;
    }
  });

  const monthly = base;
  const yearly = monthly * 12;

  const valEl = qs(".estimator__value");
  if (valEl) valEl.textContent = `$${monthly.toLocaleString()}/mo`;

  const yearEl = qs(".estimator__yearly");
  if (yearEl) yearEl.textContent = `$${yearly.toLocaleString()}/yr`;
}

function handleSlider(e) {
  const out = e.target.nextElementSibling;
  if (out) out.textContent = e.target.value;
  updateValues();
}

function handlePillClick(e) {
  const btn = e.currentTarget;
  const pressed = btn.getAttribute("aria-pressed") === "true";
  btn.setAttribute("aria-pressed", String(!pressed));
  updateValues();
}

export function initSavingsEstimator() {
  qsa(".estimator [type='range']").forEach((slider) =>
    slider.addEventListener("input", handleSlider)
  );

  qsa(".estimator [data-value]").forEach((pill) =>
    pill.addEventListener("click", handlePillClick)
  );

  updateValues();
}
