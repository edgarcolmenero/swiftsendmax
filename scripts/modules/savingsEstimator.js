// /scripts/modules/savingsEstimator.js
// Savings Estimator logic: compute annual savings based on ACH shift assumptions

import { qs, qsa } from "../utils/dom.js";

const CARD_RATE = 0.029;
const CARD_FIXED = 0.3;
const ACH_RATE = 0.008;
const ACH_FIXED = 0.05;

function formatCurrency(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

function calculateSavings(volume, ticket, achPercent) {
  if (!volume || !ticket || achPercent <= 0) return 0;

  const transactions = volume / ticket;
  const shiftedRatio = Math.min(Math.max(achPercent, 0), 100) / 100;
  const shiftedVolume = volume * shiftedRatio;
  const shiftedTransactions = transactions * shiftedRatio;

  const cardCost = shiftedVolume * CARD_RATE + shiftedTransactions * CARD_FIXED;
  const achCost = shiftedVolume * ACH_RATE + shiftedTransactions * ACH_FIXED;

  return Math.max(cardCost - achCost, 0);
}

function updateEstimator(form) {
  const volume = Number(form.volume.value);
  const ticket = Number(form.ticket.value);
  const ach = Number(form.ach.value);

  const monthly = calculateSavings(volume, ticket, ach);
  const yearly = monthly * 12;

  const result = form.querySelector(".result");
  if (!result) return;

  if (!monthly) {
    result.textContent = "$0 estimated / year";
    return;
  }

  result.innerHTML = `<strong>${formatCurrency(yearly)}</strong> estimated / year <span class="result__monthly">(${formatCurrency(
    monthly
  )} per month)</span>`;
}

export function initSavingsEstimator() {
  const form = qs("#savingsForm.estimator");
  if (!form) return;

  const inputs = qsa("input", form);
  inputs.forEach((input) => {
    const field = input.closest(".field");

    const handle = () => {
      if (field) {
        field.classList.toggle("is-filled", Boolean(input.value));
      }
      updateEstimator(form);
    };

    handle();
    input.addEventListener("input", handle);
  });

}

export default initSavingsEstimator;
