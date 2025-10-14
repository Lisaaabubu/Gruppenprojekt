const apiKey = "d14bf21cb8077992fd7982e5d47b8b62";

function getWeather() {
  const cityInput = document.getElementById("city");
  if (!cityInput) return; // nicht auf dieser Seite
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

  fetch(currentUrl)
    .then((res) => res.json())
    .then((data) => {
      // ✅ Wenn Stadt nicht gefunden oder keine Koordinaten vorhanden:
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

  fetch(forecastUrl)
    .then((res) => res.json())
    .then((data) => {
      if (data.list) showForecast(data.list);
    })
    .catch(() => {});
}

function showWeather(data) {
  const tempDiv = document.getElementById("temp-div");
  const infoDiv = document.getElementById("weather-info");
  const icon = document.getElementById("weather-icon");
  const img = document.getElementById("condition-img");

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

function saveCity() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Keine Stadt eingegeben.");
  let cities = JSON.parse(localStorage.getItem("cities") || "[]");
  if (!cities.includes(city)) cities.push(city);
  localStorage.setItem("cities", JSON.stringify(cities));
  alert(`„${city}“ gespeichert.`);
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
    list.parentElement.appendChild(p); // unter der Überschrift anzeigen
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
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("contactStatus").textContent =
      "Nachricht gesendet (Demo).";
    form.reset();
  });
}

window.onload = () => {
  loadCities();
  initContactForm();
  const selected = localStorage.getItem("selectedCity");
  if (selected && document.getElementById("city")) {
    document.getElementById("city").value = selected;
    localStorage.removeItem("selectedCity");
    getWeather();
  }
};
