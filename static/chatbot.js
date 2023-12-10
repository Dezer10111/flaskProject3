// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to the chatbot button for toggling chat window visibility
    document.getElementById('chatbotButton').addEventListener('click', function() {
        var chatWindow = document.getElementById('chatbotChatWindow');
        // Toggle chat window display between none and block
        chatWindow.style.display = chatWindow.style.display === 'block' ? 'none' : 'block';
    });

    // Event listener for sending a chatbot message
    document.getElementById('sendChatbotMessage').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default form submission behavior
        var message = document.getElementById('chatbotInput').value; // Get user input
        document.getElementById('chatbotInput').value = ''; // Clear the input field
        handleChatbotMessage(message); // Handle the message
    });

    // Function to handle a message sent to the chatbot
    function handleChatbotMessage(message) {
        var chatbotMessages = document.getElementById('chatbotMessages');
        // Display user message with bold username
        chatbotMessages.innerHTML += `<div class="chat-message"><span class="message-user">User:</span><span class="message-text">${message}</span></div>`;

        // Check if message is a weather query
        if (message.toLowerCase().startsWith("weather in ")) {
            var locationName = message.substring(11).trim(); // Extract location name
            fetchWeatherInfo(locationName); // Fetch weather info for the location
        } else {
            fetchChatbotResponse(message); // Handle other types of messages
        }
    }

    // Function to fetch weather information
    function fetchWeatherInfo(locationName) {
        // Make a request to geocode the location
        fetch(`/geocode_location?location=${encodeURIComponent(locationName)}`)
        .then(response => response.json())
        .then(geoData => {
            // Check if geocoding was successful
            if (geoData.latitude && geoData.longitude) {
                // Fetch weather data using the geocoded coordinates
                fetch(`/get_weather`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: `latitude=${encodeURIComponent(geoData.latitude)}&longitude=${encodeURIComponent(geoData.longitude)}`
                })
                .then(response => response.json())
                .then(weatherData => {
                    // Check if weather data is available
                    if (weatherData.currentWeather && weatherData.forecast) {
                        // Display current weather and forecast
                        const { temp, condition } = weatherData.currentWeather;
                        chatbotMessages.innerHTML +=
                        `<div class="chat-message"><span class="message-bot">Bot:</span><span class="message-text">Current weather in ${locationName}: ${condition}, ${temp}°C.<br>7-day Forecast:<br>${weatherData.forecast.replace(/\n/g, '<br>')}</span></div>`;
                    } else {
                        chatbotMessages.innerHTML += `<div class="chat-message"><span class="message-bot">Bot:</span><span class="message-text">Error fetching weather information.</span></div>`;
                    }
                    // Auto-scroll to the bottom of the chat
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
                });
            } else {
                chatbotMessages.innerHTML += `<div class="chat-message"><span class="message-bot">Bot:</span><span class="message-text">Unable to find location.</span></div>`;
            }
        })
        .catch(error => {
            // Handle errors in fetching weather information
            chatbotMessages.innerHTML += `<div class="chat-message"><span class="message-bot">Bot:</span><span class="message-text">Error: ${error}</span></div>`;
        });
    }

    // Function to fetch response from the chatbot for general queries
    function fetchChatbotResponse(message) {
        fetch('/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `message=${encodeURIComponent(message)}`
        })
        .then(response => response.json())
        .then(data => {
            // Display bot response
            chatbotMessages.innerHTML += `<div class="chat-message"><span class="message-bot">Bot:</span><span class="message-text">${data.response}</span></div>`;
            // Auto-scroll to the bottom of the chat
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        })
        .catch(error => {
            // Handle errors in fetching bot response
            chatbotMessages.innerHTML += `<div class="chat-message"><span class="message-bot">Bot:</span><span class="message-text">Error: ${error}</span></div>`;
        });
    }
});
