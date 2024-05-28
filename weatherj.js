document.addEventListener('DOMContentLoaded', function() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('worldmap.jpg');
    const spaceTexture = textureLoader.load('space.jpg');

    const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterials = [
        new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide }),
    ];
    const skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    scene.add(skybox);

    camera.position.z = 15;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    function handleZoom(event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            camera.position.z -= 1;
        } else {
            camera.position.z += 1;
        }
    }
    document.addEventListener('wheel', handleZoom, { passive: false });

    function handleMouseDown(event) {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
    function handleMouseUp(event) {
        isDragging = false;
    }
    function handleMouseMove(event) {
        if (isDragging) {
            const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };
            earth.rotation.x += deltaMove.y * 0.01;
            earth.rotation.y += deltaMove.x * 0.01;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    function updateWeatherInfo(temperature, humidity, windSpeed, condition) {
        document.getElementById('temperature').innerText = `Temperature: ${temperature} °C`;
        document.getElementById('humidity').innerText = `Humidity: ${humidity} %`;
        document.getElementById('wind-speed').innerText = `Wind Speed: ${windSpeed} kph`;
        document.getElementById('condition').innerText = `Condition: ${condition}`;
        displayHealthInfo(temperature);
    }

    function setLoading(isLoading) {
        const loadingElement = document.querySelector('.loading');
        loadingElement.style.display = isLoading ? 'block' : 'none';
    }

    function latLongToVector3(lat, lon, radius, height) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
        const z = ((radius + height) * Math.sin(phi) * Math.sin(theta));
        const y = ((radius + height) * Math.cos(phi));
        return new THREE.Vector3(x, y, z);
    }

    function moveCameraToLocation(lat, lon) {
        const targetPosition = latLongToVector3(lat, lon, 5, 0.5);
        camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z + 15);
        camera.lookAt(targetPosition);
    }

    function displayHealthInfo(temperature) {
        let healthInfo = '';

        if (temperature < 0) {
            healthInfo = 'Extreme cold! Risk of frostbite and hypothermia. Stay indoors and keep warm.';
        } else if (temperature >= 0 && temperature <= 10) {
            healthInfo = 'Cold weather. Wear warm clothing to stay comfortable.';
        } else if (temperature > 10 && temperature <= 20) {
            healthInfo = 'Cool weather. Light to medium clothing is recommended.';
        } else if (temperature > 20 && temperature <= 30) {
            healthInfo = 'Comfortable temperature. Perfect for outdoor activities.';
        } else if (temperature > 30 && temperature <= 40) {
            healthInfo = 'Hot weather. Stay hydrated and avoid strenuous activities.';
        } else {
            healthInfo = 'Extreme heat! Risk of heat exhaustion and heatstroke. Stay indoors and keep cool.';
        }

        document.getElementById('health-info').innerText = healthInfo;
    }

    const locationInput = document.getElementById('location-input');
    const fetchWeatherButton = document.getElementById('fetch-weather');
    const suggestionsContainer = document.getElementById('suggestions');

    let cities = [];

    fetch('https://example.com/cities.json')
        .then(response => response.json())
        .then(data => {
            cities = data.cities;
        });

    locationInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        suggestionsContainer.innerHTML = '';

        if (query.length > 2) {
            const filteredCities = cities.filter(city => city.toLowerCase().startsWith(query));
            filteredCities.slice(0, 10).forEach(city => {
                const li = document.createElement('li');
                li.textContent = city;
                li.addEventListener('click', function() {
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
            const weatherApiKey = '19bcb9cf46164d57bd8163135242005';
            const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}`;
            const geocodeApiKey = '96c70008709e463e887f204061ffde32';
            const geocodeApiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${location}&key=${geocodeApiKey}`;

            try {
                setLoading(true);
                const weatherResponse = await fetch(weatherApiUrl);
                if (!weatherResponse.ok) {
                    throw new Error('Failed to fetch weather data');
                }
                const weatherData = await weatherResponse.json();
                const temperature = weatherData.current.temp_c;
                const humidity = weatherData.current.humidity;
                const windSpeed = weatherData.current.wind_kph;
                const condition = weatherData.current.condition.text;
                updateWeatherInfo(temperature, humidity, windSpeed, condition);

                const geocodeResponse = await fetch(geocodeApiUrl);
                if (!geocodeResponse.ok) {
                    throw new Error('Failed to fetch geocode data');
                }
                const geocodeData = await geocodeResponse.json();
                const lat = geocodeData.results[0].geometry.lat;
                const lon = geocodeData.results[0].geometry.lng;
                moveCameraToLocation(lat, lon);

                setLoading(false);
            } catch (error) {
                setLoading(false);
                console.error('Error:', error.message);
                alert('Error fetching data. Please try again.');
            }
        } else {
            alert('Please enter a location');
        }
    });

    function addCityMarker(lat, lon, cityName) {
        const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const markerPosition = latLongToVector3(lat, lon, 5, 0.1);
        marker.position.copy(markerPosition);
        scene.add(marker);

        marker.name = cityName;

        marker.onClick = async function() {
            const weatherApiKey = '19bcb9cf46164d57bd8163135242005';
            const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${cityName}`;

            try {
                setLoading(true);
                const weatherResponse = await fetch(weatherApiUrl);
                if (!weatherResponse.ok) {
                    throw new Error('Failed to fetch weather data');
                }
                const weatherData = await weatherResponse.json();
                const temperature = weatherData.current.temp_c;
                const humidity = weatherData.current.humidity;
                const windSpeed = weatherData.current.wind_kph;
                const condition = weatherData.current.condition.text;
                updateWeatherInfo(temperature, humidity, windSpeed, condition);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                console.error('Error:', error.message);
                alert('Error fetching data. Please try again.');
            }
        };
    }

    addCityMarker(40.7128, -74.0060, 'New York');
    addCityMarker(34.0522, -118.2437, 'Los Angeles');
    addCityMarker(51.5074, -0.1278, 'London');
    addCityMarker(35.6895, 139.6917, 'Tokyo');
    addCityMarker(-33.8688, 151.2093, 'Sydney');

    function onDocumentMouseDown(event) {
        event.preventDefault();

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.onClick) object.onClick();
        }
    }
    document.addEventListener('mousedown', onDocumentMouseDown, false);

    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.0003;
        renderer.render(scene, camera);
    }

    animate();
});
