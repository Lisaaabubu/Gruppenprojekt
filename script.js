
//API-Keys
const apiKey = "d14bf21cb8077992fd7982e5d47b8b62"; // OpenWeatherMap
const geoApiKey = "6406ec1b65mshf22b632f0d6ce5ep1d258bjsn05e4489b26d5";// RapidAPI-Key für GeoDB Cities
//API Key Alternative= e99530c41d166c62189c3550b7ba5a29
let lastValidCity = null;//Variable die zuletzt gültige Stadt speichert


// GeoDB: Prüft, ob Eingabe eine echte Stadt ist
// Prüft mit Nominatim (OpenStreetMap), ob es eine Stadt ist
async function validateCity(city) //arbeitet asynchron, kann also auf Netzwerkantwort warten
{
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent //URL für API-Request
    (                                                         //Sonderezeichen/Leerzeichen werden korrekt in URL kodiert
    city
    )
      }&format=json&addressdetails=1&limit=1`;//format=jason; detaillierte Adressinfor anfordern (Land, Region, Ort)
      //nur erstes Ergebis wird zurückgegeben (limit=1)
    
  const res = await fetch(url, //Konstante res speichert Antwort der API, wartet auf Antwort
    {               //fetch sendet HTTP-Anfrage an die API
    headers: { "User-Agent": "Wetterseite/1.0 (example@example.com)" },//damit OpenStreetMap Anfragen akzeptiert
    });

  const data = await res.json();//wandelt Antwort in ein JavaScript-Objekt um
  if (!data || data.length === 0) return null;//ist Ergebnis zurückgekommen? wenn nicht, null zurückgeben
                        //bei NULL=Stadt existiert nicht
  const place = data[0];//erstes Suchergebnis wird in place gespeichert
  const type = (place.type || "").toLowerCase();//was es ist (Staddt, land,...)
  const category = (place.category || "").toLowerCase();//allgemeine Kategorie (Ort, Gebäude,...)

  // Typen, die als Städte gelten
  const cityTypes = 
  [
    "city",
    "town",
    "village",
    "municipality",//Gemeinde
    "hamlet",//Dorf
    "locality",//Gegend
    "administrative", //nötig für Wien
  ];

  //Länder & Regionen rausfiltern
  if (["country", "continent", "state", "region"].includes(type)) return null;

  //Nur Orte akzeptieren, die place oder administrative area sind
  if (!cityTypes.includes(type) && category !== "place") return null;

  //Wenn das Land-Feld exakt der Eingabe entspricht -> kein Stadtname
  const lowerCity = city.toLowerCase();
  const countryName = place.address?.country?.toLowerCase() || "";
  if (lowerCity === countryName) return null;

  //gültige Stadt zurückgeben
  return {
    name: place.display_name.split(",")[0],//Name (nur erstes Element id String der API)
    lat: place.lat,//Breitengrad
    lon: place.lon,//Längengrad
    country: place.address?.country_code?.toUpperCase() || "",//Ländercode in Großbuchstaben
    //wenn kein Ländercode vorhanden, wird leerer String zurückgegeben (?wenn erstes da, wird zweites ausgeführt)
  };
}


//WETTER LADEN & ANZEIGEN
async function getWeather() //verhindert, dass Code weiterläuft bevor Antwort der API da ist
{//alle wichtigen Daten aus HTML holen
  const cityInput = document.getElementById("city");//Eingabefeld Stadt
  const city = cityInput?.value.trim();//entfernt Leerzeichen
  const conditionImg = document.getElementById("condition-img");
  const tempDiv = document.getElementById("temp-div");//Bereich für Temperatur
  const infoDiv = document.getElementById("weather-info");//Bereich für Wetterinfo
  const forecastDiv = document.getElementById("hourly-forecast");//Bereich für Stunden-Vorhersage

  if (!city) //wurde was eingegeben?
    {
    showStatus("Bitte gib eine Stadt ein.", "error");
    return;
    }

  // Anzeige zurücksetzen
  showStatus("Prüfe Eingabe...", "info");//Hinweis, dass Eingabe geprüft wird
  tempDiv.innerHTML = "";//alle Temperaturdaten werden gelöscht
  infoDiv.innerHTML = "";//alle Wetterdaten werden gelöscht
  forecastDiv.innerHTML = "";//alle Stunden-Vorhersage werden gelöscht
  if (conditionImg) conditionImg.style.display = "none";//Wetter-Icon wird ausgeblendet

  try 
  {
    //Prüfen, ob Stadt existiert
    const valid = await validateCity(city);
    if (!valid) 
      {
      showStatus("Keine gültige Stadt gefunden. Bitte überprüfe deine Eingabe.", "error");
      lastValidCity = null;
      return;
      }

    const { lat, lon, name } = valid;//Werte direkt aus zurückgegebenem Objekt entnehmen
    lastValidCity = name;//letzte gültige Stadt speichern
    showStatus("Lade Wetterdaten...", "info");//UX Hinweis

    //Wetterdaten abrufen
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`;
      //URL für Wetter-API zusammenbauen (Breitengrad, Längengrad, API-Key, metrische Einheiten, deutsche Sprache)
    const res = await fetch(currentUrl);//ruft Daten vom Server ab
    const data = await res.json();//wandelt Antwort in JavaScript-Objekt um
      //bei Erfolg gibt API Code 200 zurück
    if (data.cod !== 200) //wenn Erfolgscode nicht 200 ist, dann Fehler
      {
      showStatus("Fehler beim Laden der Wetterdaten.", "error");
      lastValidCity = null;
      return;
      }

    showWeather(data);//Daten an showWeather Funktion übergeben
    showStatus(`Wetterdaten für ${name} geladen.`, "success");//Erfolgsmeldung

    //Stunden-Vorhersage abrufen
    const res2 = await fetch(forecastUrl);//zweiter API-Call für Vorhersage
    const forecast = await res2.json();
    if (forecast.list) showForecast(forecast.list);//forecast.list enthält mehrere Zeitpunkte mit Wetterdaten
    //wenn list existiert, wird sie an showForecast Funktion übergeben
  } catch (err) 
      {
        console.error(err);
        showStatus("Fehler beim Laden der Wetterdaten.", "error");
        lastValidCity = null;
      }
}


//Anzeige: Aktuelles Wetter

function showWeather(data)
{
  const tempDiv = document.getElementById("temp-div");//Bereich für Temperatur
  const infoDiv = document.getElementById("weather-info");//Bereich für Wetterinfo
  const conditionImg = document.getElementById("condition-img");//Bereich für Wetter-Icon

  const temp = Math.round(data.main.temp);//Temp in Grad Celsius, gerundet
  const cityName = data.name;//Name der Stadt
  const desc = data.weather[0].description;//Wetterbeschreibung (erstes Objet)
  const iconCode = data.weather[0].icon;//Icon-Code für Wetterzustand

  //Inhalte werden dynamisch in HTML eingefügt
  tempDiv.innerHTML = `<p>${temp}°C</p>`;
  infoDiv.innerHTML = `<p>${cityName}</p><p>${desc}</p>`;

  if (conditionImg && iconCode) //gibt es ein Icon?Icon-Code?von API?
    {
    let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;//URL für Icon (4fache vergrößerung)
    if (iconCode.endsWith("n")) //Nacht-Icons anpassen
      {
      iconUrl = "https://openweathermap.org/img/wn/01n@4x.png";//URL für Standard-Nacht-Icon
      }
    conditionImg.src = iconUrl;//setzt Bildquelle auf die URL
    conditionImg.alt = desc;//Alternativtext falls Bild nicht geladen werden kann
    conditionImg.style.display = "block";//Icon wird angezeigt
    }
}


//Anzeige: Stunden-Vorhersage

function showForecast(list) //Liste mit Wetterwerten für verschiedene Zeitpunkte
{
  const forecastDiv = document.getElementById("hourly-forecast");
  forecastDiv.innerHTML = "";//Bereich in dem Vorhersage angezeigt wird, wird geleert

  //Nur die nächsten 6 Stunden anzeigen
  list.slice(0, 6).forEach((item) => //forEach durchläuft alle 6 Emelemnte
    {
    const hour = new Date(item.dt * 1000).getHours();//Zeitstempel in Stunden umwandeln
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;

      //HTML für jede Stunde wird dynamisch erstellt und in den Bereich eingefügt
      //+=fügt neuen Inhalt an forecastDiv hinzu, ohne alten zu löschen
    forecastDiv.innerHTML += `
      <div class="hourly-item">
        <span>${hour}:00</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
        <span>${temp}°C</span>
      </div>`;
    });
}


//Favoriten-Funktionen

function saveCity() 
{
  const city = document.getElementById("city").value.trim();//holt Wert aus Eingabefeld
  if (!lastValidCity || lastValidCity.toLowerCase() !== city.toLowerCase()) //ist Stadt gültig?
    {
    showStatus("Bitte zuerst eine gültige Stadt suchen, bevor du sie speicherst.", "error");
    return;
    }

  const cities = JSON.parse(localStorage.getItem("cities") || "[]");//aktuelle Liste aus localStorage holen
  //wandelt JSON-String in JavaScript-Array um, wenn noch nicht gespeichert =leeres Arryay
  if (!cities.includes(lastValidCity)) cities.push(lastValidCity);
  //ist Stadt bereits im Array?, wenn nicht hinzufügen
  localStorage.setItem("cities", JSON.stringify(cities));
  //Array wird wieder in JSON-String umgewandelt und im localStorage gespeichert
  showStatus(`„${lastValidCity}“ wurde gespeichert.`, "success");//UX Hinweis
}

function loadCities()//lädt alle gespeicherten städte
{
  const list = document.getElementById("savedCitiesList");//sucht ul oder div Elemente=gespeicherte Städte
  if (!list) return;
  const cities = JSON.parse(localStorage.getItem("cities") || "[]");//holt Favoriten aus localStorage
  //wenn nichts gespeichert = leeres Array
  list.innerHTML = "";//Liste wird geleert

  if (cities.length === 0) //sind Städte gespeichert?
    {
    const p = document.createElement("p");//erstellt neuen Absatz
    p.textContent = "Keine Städte gespeichert.";//UX Hinweis
    p.style.color = "#fff";
    list.parentElement.appendChild(p);//Absatz wird unter der Liste eingefügt
    //parentElement=übergeordnetes Element der Liste
    return;
    }
//Städte werden dynamisch eingefügt
  cities.forEach((city) => 
    {
    const li = document.createElement("li");
    li.innerHTML = `<button onclick="selectCity('${city}')">${city}</button>`;//erstellt Button für jede Stadt
    //bei Click wird Stadt selected
    list.appendChild(li);//fügt Listenelement der Liste hinzu
    });
}

function selectCity(city) 
{//speichert gewählte Stadt im localStorage und lädt Wetterseite
  localStorage.setItem("selectedCity", city);
  window.location.href = "weather.html";
}

function clearCities() 
{//löscht alle gespeicherten Städte
  localStorage.removeItem("cities");//entfernt Eintrag aus localStorage
  loadCities();//Liste wird neu geladen und ist leer
  showStatus("Alle Favoriten gelöscht.", "success");//UX Hinweis
}


//Einheitliche Statusmeldungen

function showStatus(message, type = "info") 
{
  const status = document.getElementById("status");
  if (!status) return;//gibt es Status-Element?

  let symbol = "";//Symbol für Meldung
  switch (type) 
  {
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

  status.textContent = `${symbol}  ${message}`;//Meldung mit Symbol anzeigen
  //Meldung nach 4 Sekunden ausblenden
  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => 
    {
    status.textContent = "";
    }, 4000);
}


//Automatischer Start

window.onload = () => //erst ausführen wenn Seite komplett geladen ist
  {
  loadCities();//Lädt Favoriten
  const selected = localStorage.getItem("selectedCity");//prüft ob Stadt ausgewählt wurde
  //zb bei Klick auf Favorit wird er im localStorage gespeichert
  if (selected && document.getElementById("city")) //gibt es ausgewählte Stadt? gibt es Eingabefeld?
    {
    document.getElementById("city").value = selected;//schreibt gespeicherte Stadt in Eingabefeld
    localStorage.removeItem("selectedCity");//entfernt Eintrag aus localStorage
    getWeather();//lädt Wetter für die Stadt
    }
  };
