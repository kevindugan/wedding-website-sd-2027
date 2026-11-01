
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
