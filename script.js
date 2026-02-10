// Configuration de l'API OpenWeatherMap
// IMPORTANT : Remplacez 'VOTRE_CLE_API' par votre clé API OpenWeatherMap
// Obtenir une clé gratuite sur : https://openweathermap.org/api
const API_KEY = '095e563838d0bf5f27e892735f1124fa';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Éléments DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const weatherContainer = document.getElementById('weather-container');

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

// Récupération des données météo depuis l'API
async function fetchWeatherData(city) {
    try {
        showLoading();
        hideError();
        hideWeather();
        
        const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Ville non trouvée. Vérifiez l\'orthographe.');
            } else if (response.status === 401) {
                throw new Error('Clé API invalide. Veuillez configurer votre clé API dans script.js');
            } else {
                throw new Error('Erreur lors de la récupération des données météo');
            }
        }
        
        const data = await response.json();
        displayWeatherData(data);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Affichage des données météo
function displayWeatherData(data) {
    // Nom de la ville et pays
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    
    // Date et heure actuelles
    const now = new Date();
    dateTime.textContent = formatDateTime(now);
    
    // Icône météo
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    // Température
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    feelsLike.textContent = `Ressenti : ${Math.round(data.main.feels_like)}°C`;
    
    // Description
    weatherDescription.textContent = data.weather[0].description;
    
    // Détails
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    showWeather();
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
                    const url = `${API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=fr`;
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération des données');
                    }
                    
                    const data = await response.json();
                    displayWeatherData(data);
                    
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
