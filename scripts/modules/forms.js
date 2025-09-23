// /scripts/modules/forms.js
// Enhance forms: validation hints, async submission, feedback

import { qsa } from "../utils/dom.js";

function getField(input) {
  return input.closest(".field");
}

function ensureMessageEl(field) {
  if (!field) return null;
  let msg = field.querySelector(".field__msg");
  if (!msg) {
    msg = document.createElement("small");
    msg.className = "field__msg";
    msg.style.display = "none";
    field.appendChild(msg);
  }
  return msg;
}

function setFilledState(input) {
  const field = getField(input);
  if (!field) return;
  field.classList.toggle("is-filled", Boolean(input.value));
}

function validateInput(input) {
  const field = getField(input);
  const messageEl = ensureMessageEl(field);
  let error = "";

  if (input.hasAttribute("required")) {
    if (!input.value.trim()) {
      error = "This field is required.";
    } else if (input.type === "email") {
      const valid = /\S+@\S+\.\S+/.test(input.value.trim());
      if (!valid) {
        error = "Enter a valid email.";
      }
    }
  } else if (input.type === "email" && input.value.trim()) {
    const valid = /\S+@\S+\.\S+/.test(input.value.trim());
    if (!valid) {
      error = "Enter a valid email.";
    }
  }

  if (field) {
    field.classList.toggle("is-error", Boolean(error));
    if (messageEl) {
      messageEl.textContent = error;
      messageEl.style.display = error ? "block" : "none";
    }
  }

  if (error) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
  return !error;
}

function handleInput(event) {
  const input = event.target;
  setFilledState(input);
  validateInput(input);
}

function simulateSubmit(form) {
  form.classList.add("is-submitting");
  const status = form.querySelector(".form-status");
  if (status) {
    status.textContent = "Sending…";
  }

  setTimeout(() => {
    form.classList.remove("is-submitting");
    form.classList.add("is-success");
    if (status) {
      status.textContent = "Thanks! We’ll reach out within one business day.";
    }
    form.reset();
    qsa("input, textarea, select", form).forEach((input) => {
      setFilledState(input);
      validateInput(input);
    });

    setTimeout(() => {
      form.classList.remove("is-success");
      if (status) status.textContent = "";
    }, 3200);
  }, 1200);
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const inputs = qsa("input, textarea, select", form);
  let valid = true;

  inputs.forEach((input) => {
    setFilledState(input);
    if (!validateInput(input)) {
      valid = false;
    }
  });

  if (!valid) {
    const status = form.querySelector(".form-status");
    if (status) {
      status.textContent = "Please fix the highlighted fields.";
    }
    return;
  }

  simulateSubmit(form);
}

export function initForms() {
  qsa("form").forEach((form) => {
    if (form.classList.contains("estimator")) return;
    form.addEventListener("submit", handleSubmit);
    qsa("input, textarea, select", form).forEach((input) => {
      setFilledState(input);
      input.addEventListener("input", handleInput);
      input.addEventListener("blur", handleInput);
    });
  });
}

export default initForms;
