import bcrypt from "bcryptjs"


(function () {
  const salt = bcrypt.genSaltSync(10);

  // const hash = bcrypt.hashSync("NewPasswordValue", salt);
  // console.log(`Password ${hash}`)

  const correctHash = "$2b$10$y/0nrKpP5u5RKk4SbdXxAOeCmKLZIrrFvNnub9rvMLkSp.FhEsZNW";

  const form = document.getElementById("unlock-form");
  const input = document.getElementById("unlock-password");
  const error = document.getElementById("unlock-error");
  const link = document.getElementById("unlock-link");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (bcrypt.compareSync(input.value, correctHash)) {
      link.href = "https://forms.gle/M1iJzbcieKHJ6TtVA";
      link.hidden = false;
      form.hidden = true;
      link.focus();
    } else {
      error.hidden = false;
      input.select();
    }
  });

  input.addEventListener("input", () => {
    error.hidden = true;
  });
})();