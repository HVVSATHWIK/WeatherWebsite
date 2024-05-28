import fetch from 'node-fetch';

// Function to fetch weather data from the API
async function fetchWeatherData(latitude, longitude, apiKey) {
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();

        // Extract relevant weather information
        const temperature = data.current.temp_c;
        const humidity = data.current.humidity;
        const windSpeed = data.current.wind_kph;

        // Handle weather data (e.g., store in a database, send to client, etc.)
        console.log('Temperature:', temperature);
        console.log('Humidity:', humidity);
        console.log('Wind Speed:', windSpeed);
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
    }
}

// Example usage
const latitude = 40.7128; // Example latitude (New York City)
const longitude = -74.0060; // Example longitude (New York City)
const apiKey = '19bcb9cf46164d57bd8163135242005'; // Replace with your actual API key

// Fetch weather data for the specified location
fetchWeatherData(latitude, longitude, apiKey);
