document.addEventListener('DOMContentLoaded', function() {
    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('worldmap.jpg');
    const spaceTexture = textureLoader.load('space.jpg');

    // Earth Setup
    const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Skybox Setup
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterial = new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide });
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);

    // Camera and Lighting
    camera.position.z = 20;
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // GeoJSON Parsing and Visualization
    fetch('data/map.geojson')
        .then(response => response.json())
        .then(geojson => {
            geojson.features.forEach(feature => {
                const coordinates = feature.geometry.coordinates[0]; // Assuming polygons
                const points = coordinates.map(([lon, lat]) => latLongToVector3(lat, lon, 5));
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 });
                const line = new THREE.LineLoop(lineGeometry, lineMaterial);
                scene.add(line);
            });
        });

    function latLongToVector3(lat, lon, radius, depth = 0.05) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius - depth) * Math.sin(phi) * Math.cos(theta);
        const z = (radius - depth) * Math.sin(phi) * Math.sin(theta);
        const y = (radius - depth) * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    // Mouse and Zoom Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    function handleZoom(event) {
        event.preventDefault();
        camera.position.z = Math.max(10, Math.min(100, camera.position.z + event.deltaY * 0.05));
    }
    document.addEventListener('wheel', handleZoom, { passive: false });

    function handleMouseDown(event) {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
    function handleMouseUp() {
        isDragging = false;
    }
    function handleMouseMove(event) {
        if (isDragging) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
            earth.rotation.y += deltaMove.x * 0.005;
            earth.rotation.x += deltaMove.y * 0.005;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    // Weather Information Display
    function updateWeatherInfo(temperature, humidity, windSpeed, condition) {
        document.getElementById('temperature').innerHTML = `Temperature: ${temperature}°C`;
        document.getElementById('humidity').innerHTML = `Humidity: ${humidity}%`;
        document.getElementById('wind-speed').innerHTML = `Wind Speed: ${windSpeed} m/s`;
        document.getElementById('condition').innerHTML = `Condition: ${condition}`;
    }

    function displayHealthInfo(temperature) {
        const healthInfo = temperature < 0 ? 'Extreme cold! Stay indoors and keep warm.' :
                          temperature <= 10 ? 'Cold weather. Wear warm clothing.' :
                          temperature <= 20 ? 'Cool weather. Light to medium clothing recommended.' :
                          temperature <= 30 ? 'Comfortable. Perfect for outdoor activities.' :
                          temperature <= 40 ? 'Hot weather. Stay hydrated.' :
                          'Extreme heat! Stay indoors and keep cool.';
        document.getElementById('health-info').innerText = healthInfo;
    }

    function moveCameraToLocation(lat, lon) {
        const targetPosition = latLongToVector3(lat, lon, 5);
        camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z + 15);
        camera.lookAt(targetPosition);
    }

    // Leaflet Map Setup
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const apiKey = 'Your_API_Key';
    const overlayMaps = {
        "Clouds": L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`),
        "Temperature": L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`),
        "Rain": L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`)
    };

    L.control.layers(null, overlayMaps).addTo(map);
    overlayMaps["Clouds"].addTo(map);

    function centerMapOnLocation(lat, lon) {
        map.setView([lat, lon], 10);
    }

    // City Autocomplete and Weather Fetch
    const locationInput = document.getElementById('location-input');
    const fetchWeatherButton = document.getElementById('fetch-weather');
    const suggestionsContainer = document.getElementById('suggestions');
    let cities = [];

    fetch('https://example.com/cities.json')
        .then(response => response.json())
        .then(data => { cities = data.cities; });

    locationInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        if (query.length > 2) {
            const filteredCities = cities.filter(city => city.toLowerCase().startsWith(query)).slice(0, 10);
            filteredCities.forEach(city => {
                const li = document.createElement('li');
                li.textContent = city;
                li.addEventListener('click', () => {
                    locationInput.value = city;
                    suggestionsContainer.innerHTML = '';
                });
                suggestionsContainer.appendChild(li);
            });
        }
    });

    fetchWeatherButton.addEventListener('click', async () => {
        const location = locationInput.value;
        if (location) {
            const weatherApiKey = '';
            const geocodeApiKey = '';
            const geocodeApiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${location}&key=${geocodeApiKey}`;
            
            try {
                setLoading(true);

                const geocodeResponse = await fetch(geocodeApiUrl);
                if (!geocodeResponse.ok) throw new Error('Failed to fetch geocode data');
                const geocodeData = await geocodeResponse.json();
                const lat = geocodeData.results[0].geometry.lat;
                const lon = geocodeData.results[0].geometry.lng;

                const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`;
                const weatherResponse = await fetch(weatherApiUrl);
                if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');
                const weatherData = await weatherResponse.json();
                
                updateWeatherInfo(weatherData.main.temp, weatherData.main.humidity, weatherData.wind.speed, weatherData.weather[0].description);
                moveCameraToLocation(lat, lon);
                centerMapOnLocation(lat, lon);
                displayHealthInfo(weatherData.main.temp);
            } catch (error) {
                console.error(error);
                alert('Error fetching weather data. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    animate();
});

function setLoading(isLoading) {
    document.querySelector('.loading').style.display = isLoading ? 'block' : 'none';
}
