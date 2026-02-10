// Configuration des API gratuites (pas de clé requise)
// Géocodage : Nominatim (OpenStreetMap)
// Météo : Open-Meteo API
const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Éléments DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const weatherContainer = document.getElementById('weather-container');
const weatherAnimation = document.getElementById('weather-animation');

// Éléments d'affichage météo
const cityName = document.getElementById('city-name');
const dateTime = document.getElementById('date-time');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const weatherDescription = document.getElementById('weather-description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');

// Écouteurs d'événements
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Fonction principale de recherche
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (city === '') {
        showError('Veuillez entrer le nom d\'une ville');
        return;
    }
    
    fetchWeatherData(city);
}

// Récupération des coordonnées de la ville
async function fetchWeatherData(city) {
    try {
        showLoading();
        hideError();
        hideWeather();
        clearWeatherAnimation();
        
        // Étape 1 : Géocodage pour obtenir les coordonnées
        const geocodingUrl = `${GEOCODING_URL}?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=fr`;
        const geoResponse = await fetch(geocodingUrl, {
            headers: {
                'User-Agent': 'AppliMeteo/1.0'
            }
        });
        
        if (!geoResponse.ok) {
            throw new Error('Erreur lors de la recherche de la ville');
        }
        
        const geoData = await geoResponse.json();
        
        if (geoData.length === 0) {
            throw new Error('Ville non trouvée. Vérifiez l\'orthographe.');
        }
        
        const location = geoData[0];
        const latitude = location.lat;
        const longitude = location.lon;
        
        // Étape 2 : Récupérer les données météo
        const weatherUrl = `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error('Erreur lors de la récupération des données météo');
        }
        
        const weatherData = await weatherResponse.json();
        displayWeatherData(weatherData, location);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Affichage des données météo
function displayWeatherData(data, location) {
    // Nom de la ville
    const cityDisplay = location.display_name.split(',')[0];
    const country = location.display_name.split(',').pop().trim();
    cityName.textContent = `${cityDisplay}, ${country}`;
    
    // Date et heure actuelles
    const now = new Date();
    dateTime.textContent = formatDateTime(now);
    
    const current = data.current;
    
    // Icône météo basée sur le code météo
    const weatherCode = current.weather_code;
    const weatherInfo = getWeatherInfo(weatherCode);
    weatherIcon.textContent = weatherInfo.icon;
    weatherIcon.style.fontSize = '80px';
    weatherIcon.removeAttribute('src');
    weatherIcon.removeAttribute('alt');
    
    // Température
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    feelsLike.textContent = `Ressenti : ${Math.round(current.apparent_temperature)}°C`;
    
    // Description
    weatherDescription.textContent = weatherInfo.description;
    
    // Détails
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
    visibility.textContent = current.precipitation > 0 ? `Précipitations: ${current.precipitation} mm` : 'Bonne';
    
    // Activer les animations météo
    createWeatherAnimation(weatherCode);
    
    showWeather();
}

// Conversion des codes météo en description et icône
function getWeatherInfo(code) {
    const weatherCodes = {
        0: { description: 'Ciel dégagé', icon: '☀️' },
        1: { description: 'Principalement dégagé', icon: '🌤️' },
        2: { description: 'Partiellement nuageux', icon: '⛅' },
        3: { description: 'Couvert', icon: '☁️' },
        45: { description: 'Brouillard', icon: '🌫️' },
        48: { description: 'Brouillard givrant', icon: '🌫️' },
        51: { description: 'Bruine légère', icon: '🌦️' },
        53: { description: 'Bruine modérée', icon: '🌦️' },
        55: { description: 'Bruine dense', icon: '🌧️' },
        61: { description: 'Pluie légère', icon: '🌧️' },
        63: { description: 'Pluie modérée', icon: '🌧️' },
        65: { description: 'Pluie forte', icon: '⛈️' },
        71: { description: 'Neige légère', icon: '🌨️' },
        73: { description: 'Neige modérée', icon: '❄️' },
        75: { description: 'Neige forte', icon: '❄️' },
        77: { description: 'Grains de neige', icon: '❄️' },
        80: { description: 'Averses légères', icon: '🌦️' },
        81: { description: 'Averses modérées', icon: '🌧️' },
        82: { description: 'Averses violentes', icon: '⛈️' },
        85: { description: 'Averses de neige légères', icon: '🌨️' },
        86: { description: 'Averses de neige fortes', icon: '❄️' },
        95: { description: 'Orage', icon: '⛈️' },
        96: { description: 'Orage avec grêle légère', icon: '⛈️' },
        99: { description: 'Orage avec grêle forte', icon: '⛈️' }
    };
    
    return weatherCodes[code] || { description: 'Météo inconnue', icon: '🌍' };
}

// Création des animations météo dynamiques
function createWeatherAnimation(weatherCode) {
    // Nettoyer les animations précédentes
    weatherAnimation.innerHTML = '';
    
    // Changer le fond selon la météo
    updateBackground(weatherCode);
    
    // Soleil (codes 0, 1)
    if (weatherCode === 0 || weatherCode === 1) {
        const sun = document.createElement('div');
        sun.className = 'sun-rays';
        weatherAnimation.appendChild(sun);
    }
    
    // Nuages (codes 2, 3)
    if (weatherCode === 2 || weatherCode === 3) {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.textContent = '☁️';
            cloud.style.top = `${Math.random() * 60}%`;
            cloud.style.animationDelay = `${i * 3}s`;
            weatherAnimation.appendChild(cloud);
        }
    }
    
    // Brouillard (codes 45, 48)
    if (weatherCode === 45 || weatherCode === 48) {
        const fog = document.createElement('div');
        fog.className = 'fog';
        weatherAnimation.appendChild(fog);
    }
    
    // Pluie (codes 51, 53, 55, 61, 63, 65, 80, 81, 82)
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
        const rainCount = weatherCode >= 63 ? 100 : 50; // Plus de pluie si intense
        for (let i = 0; i < rainCount; i++) {
            const rain = document.createElement('div');
            rain.className = 'rain';
            rain.style.left = `${Math.random() * 100}%`;
            rain.style.animationDelay = `${Math.random() * 2}s`;
            rain.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            weatherAnimation.appendChild(rain);
        }
    }
    
    // Neige (codes 71, 73, 75, 77, 85, 86)
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        const snowCount = weatherCode >= 75 ? 50 : 30;
        for (let i = 0; i < snowCount; i++) {
            const snow = document.createElement('div');
            snow.className = 'snow';
            snow.textContent = '❄️';
            snow.style.left = `${Math.random() * 100}%`;
            snow.style.fontSize = `${10 + Math.random() * 20}px`;
            snow.style.animationDelay = `${Math.random() * 4}s`;
            snow.style.animationDuration = `${3 + Math.random() * 2}s`;
            weatherAnimation.appendChild(snow);
        }
    }
    
    // Orage (éclairs) (codes 95, 96, 99)
    if ([95, 96, 99].includes(weatherCode)) {
        const lightning = document.createElement('div');
        lightning.className = 'lightning';
        weatherAnimation.appendChild(lightning);
        
        // Ajouter de la pluie aussi
        for (let i = 0; i < 80; i++) {
            const rain = document.createElement('div');
            rain.className = 'rain';
            rain.style.left = `${Math.random() * 100}%`;
            rain.style.animationDelay = `${Math.random() * 2}s`;
            rain.style.animationDuration = `${0.3 + Math.random() * 0.3}s`;
            weatherAnimation.appendChild(rain);
        }
    }
}

// Mise à jour du fond d'écran selon la météo
function updateBackground(weatherCode) {
    const body = document.body;
    
    // Soleil
    if (weatherCode === 0 || weatherCode === 1) {
        body.style.background = 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)';
    }
    // Nuageux
    else if (weatherCode === 2 || weatherCode === 3) {
        body.style.background = 'linear-gradient(135deg, #7F8C8D 0%, #95A5A6 100%)';
    }
    // Brouillard
    else if (weatherCode === 45 || weatherCode === 48) {
        body.style.background = 'linear-gradient(135deg, #BDC3C7 0%, #95A5A6 100%)';
    }
    // Pluie
    else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
        body.style.background = 'linear-gradient(135deg, #3a6073 0%, #16222a 100%)';
    }
    // Neige
    else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        body.style.background = 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)';
    }
    // Orage
    else if ([95, 96, 99].includes(weatherCode)) {
        body.style.background = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
    }
    // Défaut
    else {
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}

// Nettoyer les animations météo
function clearWeatherAnimation() {
    weatherAnimation.innerHTML = '';
}

// Formatage de la date et l'heure
function formatDateTime(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('fr-FR', options);
}

// Fonctions d'affichage/masquage des éléments
function showLoading() {
    loading.classList.add('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

function showError(message) {
    errorMessage.querySelector('p').textContent = message;
    errorMessage.classList.add('active');
    clearWeatherAnimation();
}

function hideError() {
    errorMessage.classList.remove('active');
}

function showWeather() {
    weatherContainer.classList.add('active');
}

function hideWeather() {
    weatherContainer.classList.remove('active');
}

// Chargement de la météo d'une ville par défaut au démarrage (optionnel)
window.addEventListener('load', () => {
    // Vous pouvez décommenter la ligne suivante pour charger Paris par défaut
    // fetchWeatherData('Paris');
});

// Alternative : Utilisation de la géolocalisation pour obtenir la météo locale
function getWeatherByLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    showLoading();
                    hideError();
                    hideWeather();
                    clearWeatherAnimation();
                    
                    // Géocodage inverse pour obtenir le nom de la ville
                    const reverseGeoUrl = `${GEOCODING_URL}?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`;
                    const geoResponse = await fetch(reverseGeoUrl, {
                        headers: {
                            'User-Agent': 'AppliMeteo/1.0'
                        }
                    });
                    
                    const geoData = await geoResponse.json();
                    const location = geoData[0] || { display_name: 'Votre position' };
                    
                    // Récupérer les données météo
                    const weatherUrl = `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl&timezone=auto`;
                    const weatherResponse = await fetch(weatherUrl);
                    
                    if (!weatherResponse.ok) {
                        throw new Error('Erreur lors de la récupération des données');
                    }
                    
                    const weatherData = await weatherResponse.json();
                    displayWeatherData(weatherData, location);
                    
                } catch (error) {
                    showError(error.message);
                } finally {
                    hideLoading();
                }
            },
            (error) => {
                showError('Impossible d\'obtenir votre position');
            }
        );
    } else {
        showError('La géolocalisation n\'est pas supportée par votre navigateur');
    }
}

// Pour activer la géolocalisation automatique au chargement, décommentez :
// window.addEventListener('load', getWeatherByLocation);
