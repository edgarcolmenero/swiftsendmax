// /scripts/modules/forms.js
// Enhance forms: validation hints, async submission, feedback

import { qs, qsa, addClass, removeClass } from "../utils/dom.js";

function validateField(field) {
  if (!field.hasAttribute("required")) return true;
  if (field.type === "email") {
    const valid = /\S+@\S+\.\S+/.test(field.value.trim());
    field.setCustomValidity(valid ? "" : "Please enter a valid email.");
    return valid;
  }
  const valid = field.value.trim() !== "";
  field.setCustomValidity(valid ? "" : "This field is required.");
  return valid;
}

function handleInput(e) {
  validateField(e.target);
}

function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fields = qsa("input, textarea, select", form);
  let valid = true;

  fields.forEach((field) => {
    if (!validateField(field)) {
      valid = false;
      addClass(field, "is-invalid");
    } else {
      removeClass(field, "is-invalid");
    }
  });

  if (!valid) return;

  // Simulate async submit
  addClass(form, "is-submitting");
  setTimeout(() => {
    removeClass(form, "is-submitting");
    addClass(form, "is-success");
    form.reset();
    setTimeout(() => removeClass(form, "is-success"), 3000);
  }, 1200);
}

export function initForms() {
  qsa("form").forEach((form) => {
    form.addEventListener("submit", handleSubmit);
    qsa("input, textarea, select", form).forEach((field) =>
      field.addEventListener("input", handleInput)
    );
  });
}
