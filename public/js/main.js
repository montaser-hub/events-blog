"use strict";

// Confirm destructive form submissions (replaces inline onclick handlers,
// which the Content Security Policy blocks).
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    if (!window.confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// Bootstrap-style client-side validation feedback
document.querySelectorAll("form.needs-validation").forEach((form) => {
  form.addEventListener("submit", (e) => {
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
    }
    form.classList.add("was-validated");
  });
});

// Prevent double submits: disable the button once a valid form is sent
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    if (e.defaultPrevented) return;
    const button = form.querySelector('button[type="submit"]');
    if (button) window.setTimeout(() => (button.disabled = true), 0);
  });
});

// Avatar: validate size client-side and preview before uploading
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatarPreview");
if (avatarInput && avatarPreview) {
  avatarInput.addEventListener("change", () => {
    const [file] = avatarInput.files;
    avatarInput.setCustomValidity("");
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      avatarInput.setCustomValidity("Image is too large (max 2 MB).");
      avatarInput.reportValidity();
      return;
    }
    const img = document.createElement("img");
    img.className = "avatar avatar-xl";
    img.alt = "Preview of your new picture";
    img.src = URL.createObjectURL(file);
    avatarPreview.replaceChildren(img);
  });
}
