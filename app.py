import requests
from flask import Flask, jsonify, render_template, request
import openai
import os
from datetime import datetime

app = Flask(__name__)

# API keys for various services
WEATHERAPI_API_KEY = ''
POSITIONSTACK_API_KEY = ''
OPENAI_API_KEY = os.getenv('')

# Set the OpenAI API key
openai.api_key = ''

# Route for the home page
@app.route('/')
def index():
    return render_template('index.html')

# Function to get latitude and longitude for a location name
def geocode_location(location_name):
    geocode_url = f"http://api.positionstack.com/v1/forward?access_key={POSITIONSTACK_API_KEY}&query={location_name}"
    try:
        response = requests.get(geocode_url)
        response.raise_for_status()
        geocode_data = response.json()
        if geocode_data['data']:
            latitude = geocode_data['data'][0]['latitude']
            longitude = geocode_data['data'][0]['longitude']
            return latitude, longitude
        else:
            return None, None
    except requests.exceptions.RequestException as e:
        return None, None

# Route to get latitude and longitude for a given location
@app.route('/geocode_location')
def geocode_location_route():
    location_name = request.args.get('location')
    latitude, longitude = geocode_location(location_name)
    if latitude and longitude:
        return jsonify({'latitude': latitude, 'longitude': longitude, 'locationName': location_name})
    else:
        return jsonify({'error': 'Location not found'}), 404

# Function to get weather data for a given latitude and longitude
def get_weather_data(latitude, longitude, location_name):
    current_weather_url = f'http://api.weatherapi.com/v1/current.json?key={WEATHERAPI_API_KEY}&q={latitude},{longitude}&aqi=no'
    forecast_url = f'http://api.weatherapi.com/v1/forecast.json?key={WEATHERAPI_API_KEY}&q={latitude},{longitude}&days=7&aqi=no'

    try:
        current_response = requests.get(current_weather_url)
        current_response.raise_for_status()
        current_weather_data = current_response.json()

        forecast_response = requests.get(forecast_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        temp = current_weather_data['current']['temp_c']
        condition = current_weather_data['current']['condition']['text']

        forecast_summary = ""
        for day in forecast_data['forecast']['forecastday']:
            date_str = day['date']
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            day_of_week = date_obj.strftime('%A')
            day_condition = day['day']['condition']['text']
            max_temp = day['day']['maxtemp_c']
            min_temp = day['day']['mintemp_c']
            forecast_summary += f"{day_of_week}: {day_condition}, High: {max_temp}°C, Low: {min_temp}°C\n"

        return {
            'currentWeather': {'temp': temp, 'condition': condition},
            'forecast': forecast_summary,
            'locationName': location_name
        }

    except requests.exceptions.RequestException as e:
        return {'error': str(e)}

# Route to get weather data
@app.route('/get_weather', methods=['POST'])
def get_weather_route():
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    location_name = request.form.get('location_name', 'Unknown Location')

    if latitude and longitude:
        weather_info = get_weather_data(latitude, longitude, location_name)
        return jsonify(weather_info)
    else:
        return jsonify({'error': 'Invalid or missing latitude/longitude'}), 400

# Route to handle chatbot interactions
@app.route('/chatbot', methods=['POST'])
def chatbot():
    user_message = request.form['message']

    # Check if the message is about weather and handle accordingly
    if "weather in" in user_message.lower():
        location = user_message.lower().split("weather in", 1)[1].strip()
        lat, lon = geocode_location(location)
        if lat is not None and lon is not None:
            weather_info = get_weather_data(lat, lon)
            response_message = f"The weather in {location.title()} is {weather_info}."
        else:
            response_message = f"I couldn't find the weather for {location.title()}."
    else:
        # Handle non-weather related queries using OpenAI's API
        openai_response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=user_message,
            max_tokens=150
        )
        response_message = openai_response.choices[0].text.strip()

    return jsonify({'response': response_message})

if __name__ == '__main__':
    app.run(debug=True)
