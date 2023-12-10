// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize and display the map
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Function to update the map view based on latitude and longitude
    function updateMapView(lat, lon) {
        map.setView([lat, lon], 13);
    }

    // Function to fetch weather data for a given location
    function fetchWeatherForLocation(locationName) {
        fetch(`/geocode_location?location=${encodeURIComponent(locationName)}`)
        .then(response => response.json())
        .then(geoData => {
            if (geoData.latitude && geoData.longitude) {
                updateMapView(geoData.latitude, geoData.longitude);
                fetchWeatherData(geoData.latitude, geoData.longitude, geoData.locationName);
            } else {
                document.getElementById('weatherDisplay').innerHTML = '<p>Unable to find location.</p>';
            }
        })
        .catch(error => {
            document.getElementById('weatherDisplay').innerHTML = `<p>An error occurred: ${error}</p>`;
        });
    }

    // Function to fetch weather data from the server
    function fetchWeatherData(lat, lon, locationName) {
        fetch(`/get_weather`, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&location_name=${encodeURIComponent(locationName)}`
        })
        .then(response => response.json())
        .then(weatherData => {
            if (!weatherData.error) {
                updateWeatherDisplay(weatherData);
            } else {
                document.getElementById('weatherDisplay').innerHTML = `<p>Error: ${weatherData.error}</p>`;
            }
        })
        .catch(error => {
            document.getElementById('weatherDisplay').innerHTML = `<p>An error occurred while fetching weather data.</p>`;
        });
    }

    // Event listener for the weather form submission
    document.getElementById('weatherForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const locationName = document.getElementById('location').value;
        fetchWeatherForLocation(locationName);
    });

    // Function to get the path of the weather icon based on the condition
    function getIconPath(condition) {
        const conditionIconMapping = {
            // Mapping of weather conditions to icon file names
            "Sunny": "day.svg",
            "Partly cloudy": "cloudy-day-1.svg",
            "Cloudy": "cloudy.svg",
            "Overcast": "cloudy.svg",
            "Mist": "mist.svg",
            "Patchy rain possible": "rainy-1.svg",
            "Patchy snow possible": "snowy-2.svg",
            "Patchy sleet possible": "sleet.svg",
            "Patchy freezing drizzle possible": "rainy-7.svg",
            "Thundery outbreaks possible": "thunder.svg",
            "Blowing snow": "snowy-5.svg",
            "Blizzard": "snowy-6.svg",
            "Fog": "fog.svg",
            "Freezing fog": "fog.svg",
            "Patchy light drizzle": "rainy-1.svg",
            "Light drizzle": "rainy-2.svg",
            "Freezing drizzle": "rainy-7.svg",
            "Heavy freezing drizzle": "rainy-7.svg",
            "Patchy light rain": "rainy-1.svg",
            "Light rain": "rainy-2.svg",
            "Moderate rain at times": "rainy-3.svg",
            "Moderate rain": "rainy-4.svg",
            "Heavy rain at times": "rainy-3.svg",
            "Heavy rain": "rainy-4.svg",
            "Light freezing rain": "rainy-6.svg",
            "Moderate or heavy freezing rain": "rainy-6.svg",
            "Light sleet": "sleet.svg",
            "Moderate or heavy sleet": "sleet.svg",
            "Patchy light snow": "snowy-1.svg",
            "Light snow": "snowy-2.svg",
            "Patchy moderate snow": "snowy-3.svg",
            "Moderate snow": "snowy-3.svg",
            "Patchy heavy snow": "snowy-5.svg",
            "Heavy snow": "snowy-6.svg",
            "Ice pellets": "snowy-6.svg",
            "Light rain shower": "rainy-1.svg",
            "Moderate or heavy rain shower": "rainy-4.svg",
            "Torrential rain shower": "rainy-5.svg",
            "Light sleet showers": "sleet.svg",
            "Moderate or heavy sleet showers": "sleet.svg",
            "Light snow showers": "snowy-1.svg",
            "Moderate or heavy snow showers": "snowy-5.svg",
            "Light showers of ice pellets": "snowy-6.svg",
            "Moderate or heavy showers of ice pellets": "snowy-6.svg",
            "Patchy light rain with thunder": "thunder.svg",
            "Moderate or heavy rain with thunder": "thunder.svg",
            "Patchy light snow with thunder": "snowy-1.svg",
            "Moderate or heavy snow with thunder": "snowy-6.svg",
        };
        return conditionIconMapping[condition] || "default.svg"; // Default icon if no match found
    }

    // Function to update the weather display for current weather and forecast
    function updateWeatherDisplay(weatherData) {
        const weatherDisplay = document.getElementById('weatherDisplay');
        const forecastDisplay = document.getElementById('forecastDisplay');

        // Clear existing content
        weatherDisplay.innerHTML = '';
        forecastDisplay.innerHTML = '';

        // Display the location name and current weather
        const locationTitle = document.createElement('h2');
        locationTitle.textContent = `Current Weather in ${weatherData.locationName}`;
        weatherDisplay.appendChild(locationTitle);

        // Create and display the current weather section
        const currentWeather = document.createElement('div');
        currentWeather.className = 'weather-item';
        const iconPath = `/static/animated/${getIconPath(weatherData.currentWeather.condition)}`;
        currentWeather.innerHTML = `
            <div class="weather-icon" style="background-image: url('${iconPath}');"></div>
            <div class="weather-temp">${weatherData.currentWeather.temp} °C</div>
            <div class="weather-condition">${weatherData.currentWeather.condition}</div>
        `;
        weatherDisplay.appendChild(currentWeather);

        // Display the forecast
        forecastDisplay.innerHTML = '<h3>7-Day Forecast:</h3>';
        weatherData.forecast.split('\n').forEach(dayForecast => {
            // Extract and display each day's forecast
            const conditionMatch = dayForecast.match(/:\s([\w\s]+),/);
            const forecastCondition = conditionMatch ? conditionMatch[1].trim() : null;
            const forecastIconPath = forecastCondition ? `/static/animated/${getIconPath(forecastCondition)}` : "/static/animated/default.svg";
            const forecastItem = document.createElement('div');
            forecastItem.className = 'weather-item';
            forecastItem.innerHTML = `
                <div class="weather-icon" style="background-image: url('${forecastIconPath}');"></div>
                <span>${dayForecast}</span>
            `;
            forecastDisplay.appendChild(forecastItem);
        });
    }
});