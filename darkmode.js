document.addEventListener("DOMContentLoaded", () => //Warte bis ganzes HTML geladen wurde,
{                                                   //sonst wird Code ausgeführt bevor Button existiert
  const toggle = document.getElementById("darkmode-toggle");
  //Konstante toggle speichert Button mit ID aus HTML

  // Zustand wiederherstellen
  if (localStorage.getItem("theme") === "dark") //prüfung ob im localStorage "dark" gespeichert ist
    {
    document.body.classList.add("darkmode");//wenn true, wird darkmode Klasse zum body hinzugefügt
    }                                       //damit wird dunkles Design aktiviert   

  // Umschalten + speichern
  if (toggle) //existiert Button?
    {
    toggle.addEventListener("click", () => //true, dann Click Event hinzugefügt
      {
      const dark = document.body.classList.toggle("darkmode");//schaltete darkmode Klasse um
      //wenn Klasse nicht vorhanden ist, wird sie hinzugefügt (darkmode aktiviert)
      //wenn Klasse vorhanden ist, wird sie entfernt (darkmode deaktiviert)
      localStorage.setItem("theme", dark ? "dark" : "light");//wenn dark true ist, wird "dark" gespeichert,
      //sonst "light". wir im localStorage gespeichert
      });
    }
});
