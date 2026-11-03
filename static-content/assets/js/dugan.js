import bcrypt from "bcryptjs"

const ITERATIONS = 600000;   // must match encrypt.mjs

async function decryptSecret(secret, password) {
  const bytes = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
  const salt = bytes.slice(0, 16), iv = bytes.slice(16, 28), data = bytes.slice(28);
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);  // fails on a wrong password
  return new TextDecoder().decode(plain);
}

(function () {
  const form = document.getElementById("unlock-form");
  const input = document.getElementById("unlock-password");
  const error = document.getElementById("unlock-error");
  const link = document.getElementById("unlock-link");
  const submit = form && form.querySelector(".unlock__submit");
  if (!form) return;

  // Section buttons with data-unlock-secret stay disabled until the password is entered.
  const lockedButtons = [...document.querySelectorAll("[data-unlock-secret]")].filter((el) => el !== link);
  lockedButtons.forEach((button) => {
    button.removeAttribute("href");
    button.setAttribute("aria-disabled", "true");
    button.title = "Enter the password at the top of the page to unlock";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submit.disabled = true;
    submit.textContent = "Checking…";

    try {
      const targets = [link, ...lockedButtons];
      const urls = await Promise.all(
        targets.map((el) => decryptSecret(el.dataset.unlockSecret, input.value)));

      console.log(urls);

      targets.forEach((el, i) => { el.href = urls[i]; });
      lockedButtons.forEach((button) => {
        button.removeAttribute("aria-disabled");
        button.removeAttribute("title");
      });
      link.hidden = false;
      form.hidden = true;
      link.focus();
    } catch {
      error.hidden = false;
      input.select();
    } finally {
      submit.disabled = false;
      submit.textContent = "Unlock";
    }
  });

  input.addEventListener("input", () => {
    error.hidden = true;
  });

  // Show/hide what's been typed in the password field.
  const toggle = document.getElementById("unlock-toggle");
  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.setAttribute("aria-pressed", String(!showing));
    toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    input.focus();
  });
})();

// Fade in each section image the first time it scrolls into view.
(function () {
  const targets = document.querySelectorAll(".split__media");

  // Older browsers: just show everything.
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // play once
        }
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((el) => observer.observe(el));
})();

// Show each image's alt text as a caption on hover. Hidden from screen readers,
// which already read the alt text.
(function () {
  document.querySelectorAll(".banner__media img, .split__media img, .gallery img").forEach((img) => {
    const text = img.getAttribute("alt");
    if (!text) return;

    // Gallery images have no wrapper of their own, so give them one to hold the caption.
    let holder = img.parentElement;
    if (img.closest(".gallery")) {
      holder = document.createElement("span");
      holder.className = "gallery__item";
      img.replaceWith(holder);
      holder.append(img);
    }

    const caption = document.createElement("span");
    caption.className = "hover-caption";
    caption.setAttribute("aria-hidden", "true");
    caption.textContent = text;
    holder.classList.add("has-caption");
    holder.append(caption);
  });
})();
