
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
  // Each gets a short hover tooltip and a note below it explaining how to unlock.
  const lockedButtons = [...document.querySelectorAll("[data-unlock-secret]")].filter((el) => el !== link);
  lockedButtons.forEach((button, i) => {
    button.removeAttribute("href");
    button.setAttribute("aria-disabled", "true");
    button.dataset.tooltip = "Locked until you enter the password";

    const note = document.createElement("p");
    note.className = "button__note";
    note.id = `unlock-note-${i}`;
    note.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>' +
      "Enter the password at the top of the page to unlock.";
    button.after(note);
    button.setAttribute("aria-describedby", note.id);   // screen readers read the note with the button
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submit.disabled = true;
    submit.textContent = "Checking…";

    try {
      const targets = [link, ...lockedButtons];
      const urls = await Promise.all(
        targets.map((el) => decryptSecret(el.dataset.unlockSecret, input.value)));

      targets.forEach((el, i) => { el.href = urls[i]; });
      lockedButtons.forEach((button) => {
        button.removeAttribute("aria-disabled");
        delete button.dataset.tooltip;
        document.getElementById(button.getAttribute("aria-describedby"))?.remove();
        button.removeAttribute("aria-describedby");
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

// Scroll cue: if none of the next section shows below the banner (e.g. small phones),
// show an arrow at the bottom of the screen until the section scrolls into view.
(function () {
  const cue = document.getElementById("scroll-cue");
  const next = document.querySelector(".split");
  if (!cue || !next || !("IntersectionObserver" in window)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();   // hide for good once the section has been seen
      if (cue.hidden) return;
      cue.classList.add("is-leaving");
      setTimeout(() => { cue.hidden = true; }, 300);   // matches the fade-out in styles.css
    } else {
      cue.hidden = false;
    }
  });
  observer.observe(next);

  cue.addEventListener("click", () => {
    next.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
