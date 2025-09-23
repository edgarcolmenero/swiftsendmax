// /scripts/modules/savingsEstimator.js
// Savings Estimator logic: sliders + pills update computed monthly/yearly savings

import { qsa } from "../utils/dom.js";

const CARD_FEE_RATE = 0.028; // 2.8% typical blended card fee
const ACH_FEE_RATE = 0.008;  // 0.8% ACH processing estimate

function formatCurrency(value) {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString()}`;
}

function parseValue(input, fallback = 0) {
  if (!input) return fallback;
  const val = parseInt(input.value, 10);
  return Number.isFinite(val) ? val : fallback;
}

function updateEstimator(root) {
  const volumeSlider = root.querySelector("[data-estimator='volume']");
  const ticketSlider = root.querySelector("[data-estimator='ticket']");
  const shiftSlider = root.querySelector("[data-estimator='shift']");

  const monthlyVolume = parseValue(volumeSlider);
  const ticket = parseValue(ticketSlider, 1);
  const shiftPercent = parseValue(shiftSlider);
  const adoptionRate = Math.min(Math.max(shiftPercent, 0), 100) / 100;

  const transactions = ticket > 0 ? Math.round(monthlyVolume / ticket) : 0;
  const achVolume = monthlyVolume * adoptionRate;
  const baseSavings = achVolume * (CARD_FEE_RATE - ACH_FEE_RATE);

  let monthlySavings = baseSavings;
  qsa("[data-value]", root).forEach((pill) => {
    if (pill.getAttribute("aria-pressed") === "true") {
      monthlySavings += parseInt(pill.dataset.value, 10) || 0;
    }
  });

  const yearlySavings = monthlySavings * 12;

  const outputs = {
    volume: root.querySelector("[data-output='volume']"),
    ticket: root.querySelector("[data-output='ticket']"),
    shift: root.querySelector("[data-output='shift']"),
    transactions: root.querySelector("[data-output='transactions']"),
    achVolume: root.querySelector("[data-output='achVolume']"),
    cardOffset: root.querySelector("[data-output='cardOffset']"),
  };

  if (outputs.volume) outputs.volume.textContent = formatCurrency(monthlyVolume);
  if (outputs.ticket) outputs.ticket.textContent = formatCurrency(ticket);
  if (outputs.shift) outputs.shift.textContent = `${shiftPercent}%`;
  if (outputs.transactions) outputs.transactions.textContent = transactions.toLocaleString();
  if (outputs.achVolume) outputs.achVolume.textContent = formatCurrency(achVolume);
  if (outputs.cardOffset) outputs.cardOffset.textContent = formatCurrency(baseSavings);

  const monthlyEl = root.querySelector("[data-result='monthly']");
  const yearlyEl = root.querySelector("[data-result='yearly']");
  if (monthlyEl) monthlyEl.textContent = `${formatCurrency(monthlySavings)}/mo`;
  if (yearlyEl) yearlyEl.textContent = `${formatCurrency(yearlySavings)}/yr`;
}

function handleSliderInput(root) {
  return () => updateEstimator(root);
}

function handlePillClick(root, pill) {
  return () => {
    const pressed = pill.getAttribute("aria-pressed") === "true";
    pill.setAttribute("aria-pressed", String(!pressed));
    updateEstimator(root);
  };
}

export function initSavingsEstimator() {
  qsa(".estimator").forEach((estimator) => {
    qsa("[data-estimator]", estimator).forEach((slider) => {
      slider.addEventListener("input", handleSliderInput(estimator));
    });

    qsa("[data-value]", estimator).forEach((pill) => {
      pill.addEventListener("click", handlePillClick(estimator, pill));
    });

    updateEstimator(estimator);
  });
}
