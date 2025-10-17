// ===============================
// 🌤️ Wetter-App Script – finale Version mit GeoDB & Statusmeldungen
// ===============================

// 🔑 API-Keys
const apiKey = "d14bf21cb8077992fd7982e5d47b8b62"; // OpenWeatherMap
const geoApiKey = "6406ec1b65mshf22b632f0d6ce5ep1d258bjsn05e4489b26d5";         // RapidAPI-Key für GeoDB Cities

let lastValidCity = null;

// ===============================
// 1️⃣ GeoDB: Prüft, ob Eingabe eine echte Stadt ist
// ===============================
// 🔍 Prüft mit GeoDB Cities API, ob es eine echte Stadt ist
// Prüft mit Nominatim (OpenStreetMap), ob es eine Stadt ist
// Prüft mit Nominatim (OpenStreetMap), ob es eine Stadt ist
// Prüft mit Nominatim (OpenStreetMap), ob es eine Stadt ist
async function validateCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    city
  )}&format=json&addressdetails=1&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Wetterseite/1.0 (example@example.com)" },
  });

  const data = await res.json();
  if (!data || data.length === 0) return null;

  const place = data[0];
  const type = (place.type || "").toLowerCase();
  const category = (place.category || "").toLowerCase();

  // Typen, die als Städte gelten
  const cityTypes = [
    "city",
    "town",
    "village",
    "municipality",
    "hamlet",
    "locality",
    "administrative", // <-- nötig für Wien
  ];

  // 1️⃣ Länder & Regionen rausfiltern
  if (["country", "continent", "state", "region"].includes(type)) return null;

  // 2️⃣ Nur Orte akzeptieren, die place oder administrative area sind
  if (!cityTypes.includes(type) && category !== "place") return null;

  // 3️⃣ Wenn das Land-Feld exakt der Eingabe entspricht -> kein Stadtname
  const lowerCity = city.toLowerCase();
  const countryName = place.address?.country?.toLowerCase() || "";
  if (lowerCity === countryName) return null;

  // ✅ gültige Stadt zurückgeben
  return {
    name: place.display_name.split(",")[0],
    lat: place.lat,
    lon: place.lon,
    country: place.address?.country_code?.toUpperCase() || "",
  };
}





// ===============================
// 2️⃣ Wetter nur laden, wenn Stadt gültig ist
// ===============================
async function getWeather() {
  const cityInput = document.getElementById("city");
  const city = cityInput?.value.trim();
  const conditionImg = document.getElementById("condition-img");
  const tempDiv = document.getElementById("temp-div");
  const infoDiv = document.getElementById("weather-info");
  const forecastDiv = document.getElementById("hourly-forecast");

  if (!city) {
    showStatus("Bitte gib eine Stadt ein.", "error");
    return;
  }

  // Anzeige zurücksetzen
  showStatus("Prüfe Eingabe...", "info");
  tempDiv.innerHTML = "";
  infoDiv.innerHTML = "";
  forecastDiv.innerHTML = "";
  if (conditionImg) conditionImg.style.display = "none";

  try {
    // 1️⃣ Prüfen, ob Stadt existiert
    const valid = await validateCity(city);
    if (!valid) {
      showStatus("Keine gültige Stadt gefunden. Bitte überprüfe deine Eingabe.", "error");
      lastValidCity = null;
      return;
    }

    const { lat, lon, name } = valid;
    lastValidCity = name;
    showStatus("Lade Wetterdaten...", "info");

    // 2️⃣ Wetterdaten abrufen
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`;

    const res = await fetch(currentUrl);
    const data = await res.json();
    if (data.cod !== 200) {
      showStatus("Fehler beim Laden der Wetterdaten.", "error");
      lastValidCity = null;
      return;
    }

    showWeather(data);
    showStatus(`Wetterdaten für ${name} geladen.`, "success");

    const res2 = await fetch(forecastUrl);
    const forecast = await res2.json();
    if (forecast.list) showForecast(forecast.list);
  } catch (err) {
    console.error(err);
    showStatus("Fehler beim Laden der Wetterdaten.", "error");
    lastValidCity = null;
  }
}

// ===============================
// 3️⃣ Anzeige: Aktuelles Wetter
// ===============================
function showWeather(data) {
  const tempDiv = document.getElementById("temp-div");
  const infoDiv = document.getElementById("weather-info");
  const conditionImg = document.getElementById("condition-img");

  const temp = Math.round(data.main.temp);
  const cityName = data.name;
  const desc = data.weather[0].description;
  const iconCode = data.weather[0].icon;

  tempDiv.innerHTML = `<p>${temp}°C</p>`;
  infoDiv.innerHTML = `<p>${cityName}</p><p>${desc}</p>`;

  if (conditionImg && iconCode) {
    let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    if (iconCode.endsWith("n")) {
      iconUrl = "https://openweathermap.org/img/wn/01n@4x.png";
    }
    conditionImg.src = iconUrl;
    conditionImg.alt = desc;
    conditionImg.style.display = "block";
  }
}

// ===============================
// 4️⃣ Anzeige: Stunden-Vorhersage
// ===============================
function showForecast(list) {
  const forecastDiv = document.getElementById("hourly-forecast");
  forecastDiv.innerHTML = "";
  list.slice(0, 6).forEach((item) => {
    const hour = new Date(item.dt * 1000).getHours();
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;

    forecastDiv.innerHTML += `
      <div class="hourly-item">
        <span>${hour}:00</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
        <span>${temp}°C</span>
      </div>`;
  });
}

// ===============================
// 5️⃣ Favoriten-Funktionen
// ===============================
function saveCity() {
  const city = document.getElementById("city").value.trim();
  if (!lastValidCity || lastValidCity.toLowerCase() !== city.toLowerCase()) {
    showStatus("Bitte zuerst eine gültige Stadt suchen, bevor du sie speicherst.", "error");
    return;
  }

  const cities = JSON.parse(localStorage.getItem("cities") || "[]");
  if (!cities.includes(lastValidCity)) cities.push(lastValidCity);
  localStorage.setItem("cities", JSON.stringify(cities));
  showStatus(`„${lastValidCity}“ wurde gespeichert.`, "success");
}

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

  cities.forEach((city) => {
    const li = document.createElement("li");
    li.innerHTML = `<button onclick="selectCity('${city}')">${city}</button>`;
    list.appendChild(li);
  });
}

function selectCity(city) {
  localStorage.setItem("selectedCity", city);
  window.location.href = "weather.html";
}

function clearCities() {
  localStorage.removeItem("cities");
  loadCities();
  showStatus("Alle Favoriten gelöscht.", "success");
}

// ===============================
// 6️⃣ Einheitliche Statusmeldungen
// ===============================
function showStatus(message, type = "info") {
  const status = document.getElementById("status");
  if (!status) return;

  let symbol = "";
  switch (type) {
    case "error":
      status.style.color = "#ff5555";
      symbol = "❌";
      break;
    case "success":
      status.style.color = "#4de070";
      symbol = "✅";
      break;
    default:
      status.style.color = "#ffffff";
      symbol = "ℹ️";
  }

  status.textContent = `${symbol}  ${message}`;

  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => {
    status.textContent = "";
  }, 4000);
}

// ===============================
// 7️⃣ Automatischer Start
// ===============================
window.onload = () => {
  loadCities();
  const selected = localStorage.getItem("selectedCity");
  if (selected && document.getElementById("city")) {
    document.getElementById("city").value = selected;
    localStorage.removeItem("selectedCity");
    getWeather();
  }
};
