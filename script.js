// API-Schlüssel für OpenWeatherMap
const apiKey = "d14bf21cb8077992fd7982e5d47b8b62";


/**
 * Liest die Stadt aus dem Eingabefeld aus
 * Holt aktuelles Wetter & Vorhersage von OpenWeatherMap
 * Steuert Lade-/Fehlerzustand und räumt die Anzeige vorab auf
 */
function getWeather() {
  const cityInput = document.getElementById("city");
  if (!cityInput) return;
  const city = cityInput.value.trim();

  const status = document.getElementById("status");
  const icon = document.getElementById("weather-icon");
  const img = document.getElementById("condition-img");
  const tempDiv = document.getElementById("temp-div");
  const infoDiv = document.getElementById("weather-info");
  const forecastDiv = document.getElementById("hourly-forecast");

  if (!city) {
    alert("Bitte gib eine Stadt ein.");
    return;
  }

  status.textContent = "Lade Wetterdaten...";
  tempDiv.innerHTML = infoDiv.innerHTML = forecastDiv.innerHTML = "";
  if (icon) icon.style.display = "none";
  if (img) img.style.display = "none";

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric&lang=de`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric&lang=de`;

  // Aktuelles Wetter abrufen
  fetch(currentUrl)
    .then((res) => res.json())
    .then((data) => {
      if (data.cod !== 200 || !data.name) {
        status.textContent =
          "❌ Keine gültige Stadt gefunden. Bitte überprüfe deine Eingabe.";
        return;
      }
      showWeather(data);
      status.textContent = "";
    })
    .catch(() => {
      status.textContent = "❌ Fehler beim Laden der Wetterdaten.";
    });

  // Vorhersage abrufen
  fetch(forecastUrl)
    .then((res) => res.json())
    .then((data) => {
      if (data.list) showForecast(data.list);
    })
    .catch(() => {});
}

/**
 * Generiert Temperatur, Stadtname, Beschreibung, API-Icon
 * Wählt zusätzlich ein eigenes Zustandsbild
 */
function showWeather(data) {
  const tempDiv = document.getElementById("temp-div");
  const infoDiv = document.getElementById("weather-info");
  const icon = document.getElementById("weather-icon");
  const img = document.getElementById("condition-img");

  // Aus dem API-Objekt die relevanten Infos extrahieren
  const temp = Math.round(data.main.temp);
  const cityName = data.name;
  const desc = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const condition = data.weather[0].main;

  tempDiv.innerHTML = `<p>${temp}°C</p>`;
  infoDiv.innerHTML = `<p>${cityName}</p><p>${desc}</p>`;

  if (icon) {
    icon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    icon.alt = desc;
    icon.style.display = "block";
  }

  // Zustandsgrafiken
  const imgMap = {
    Clear: "img/sunny.png",
    Clouds: "img/cloudy.png",
    Rain: "img/rainy.png",
    Snow: "img/snow.png",
    Thunderstorm: "img/stormy.png",
    Mist: "img/mist.png",
    default: "img/default.png",
  };
  if (img) {
    img.src = imgMap[condition] || imgMap.default;
    img.style.display = "block";
  }
}

/**
 * Zeigt die nächsten ~18 Stunden (6 Einträge à 3h) als kleine Kacheln
 * Jede Kachel: Uhrzeit, Icon, Temperatur
 */
function showForecast(list) {
  const forecastDiv = document.getElementById("hourly-forecast");
  if (!list) return;
  forecastDiv.innerHTML = "";

  const next = list.slice(0, 6);
  next.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const hour = date.getHours();
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;

    forecastDiv.innerHTML += `
      <div class="hourly-item">
        <span>${hour}:00</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
        <span>${temp}°C</span>
      </div>`;
  });
}

//Speichert die aktuelle Eingabe als Favorit in localStorage (ohne Duplikate)
function saveCity() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Keine Stadt eingegeben.");
  let cities = JSON.parse(localStorage.getItem("cities") || "[]");
  if (!cities.includes(city)) cities.push(city);
  localStorage.setItem("cities", JSON.stringify(cities));
  alert(`„${city}“ gespeichert.`);
}

/**
 * Liest Favoriten aus localStorage und generiert Buttons
 * Zeigt einen Hinweis, wenn keine Städte gespeichert sind
 */
function loadCities() {
  const list = document.getElementById("savedCitiesList");
  if (!list) return;
  const cities = JSON.parse(localStorage.getItem("cities") || "[]");
  list.innerHTML = "";
  if (cities.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Keine Städte gespeichert.";
    p.style.color = "#fff";
    list.parentElement.appendChild(p);
    return;
  }
  // Für jede Stadt einen Button erzeugen, der zur Wetterseite führt
  cities.forEach((city) => {
    const li = document.createElement("li");
    li.innerHTML = `<button onclick="selectCity('${city}')">${city}</button>`;
    list.appendChild(li);
  });
}

/**
 * Übergibt die gewählte Stadt per localStorage an die Wetterseite
 * Leitet dann zu weather.html weiter
 */
function selectCity(city) {
  localStorage.setItem("selectedCity", city);
  window.location.href = "weather.html";
}

// Löscht alle Favoriten und aktualisiert die Anzeige
function clearCities() {
  localStorage.removeItem("cities");
  loadCities();
}

/**
 * Startpunkt beim Laden jeder Seite:
 * Favoriten-Seite: Liste aufbauen
 * Wetterseite: ggf. zuvor gewählte Stadt automatisch laden
 */
window.onload = () => {
  loadCities();
  const selected = localStorage.getItem("selectedCity");
  if (selected && document.getElementById("city")) {
    document.getElementById("city").value = selected;
    localStorage.removeItem("selectedCity");
    getWeather();
  }
};
