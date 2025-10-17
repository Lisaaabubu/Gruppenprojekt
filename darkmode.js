document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkmode-toggle");

  // Zustand wiederherstellen
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("darkmode");
  }

  // Umschalten + speichern
  if (toggle) {
    toggle.addEventListener("click", () => {
      const dark = document.body.classList.toggle("darkmode");
      localStorage.setItem("theme", dark ? "dark" : "light");
    });
  }
});
