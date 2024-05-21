// Three.js setup code

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(5, 32, 32);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('worldmap.jpg');
const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
const earth = new THREE.Mesh(geometry, earthMaterial);
scene.add(earth);

camera.position.z = 15;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const spaceTexture = textureLoader.load('space.jpg');
const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
const skyMaterial = new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide });
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

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

function updateWeatherInfo(temperature, humidity, windSpeed) {
    document.getElementById('temperature').innerText = `Temperature: ${temperature} °C`;
    document.getElementById('humidity').innerText = `Humidity: ${humidity} %`;
    document.getElementById('wind-speed').innerText = `Wind Speed: ${windSpeed} kph`;
}

function setLoading(isLoading) {
    const loadingElement = document.querySelector('.loading');
    loadingElement.style.display = isLoading ? 'block' : 'none';
}

// Function to convert latitude and longitude to 3D coordinates on the globe
function latLongToVector3(lat, lon, radius, height) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
    const z = ((radius + height) * Math.sin(phi) * Math.sin(theta));
    const y = ((radius + height) * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

// Function to move the camera to a specific location
function moveCameraToLocation(lat, lon) {
    const targetPosition = latLongToVector3(lat, lon, 5, 0.5);
    camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z + 15);
    camera.lookAt(targetPosition);
}

document.getElementById('fetch-weather').addEventListener('click', async () => {
    const location = document.getElementById('location-input').value;
    if (location) {
        const weatherApiKey = '19bcb9cf46164d57bd8163135242005'; // Your actual API key
        const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}`;
        const geocodeApiKey = '96c70008709e463e887f204061ffde32'; // Your OpenCage API key
        const geocodeApiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${location}&key=${geocodeApiKey}`;

        try {
            setLoading(true);
            // Fetch weather data
            const weatherResponse = await fetch(weatherApiUrl);
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            const weatherData = await weatherResponse.json();
            const temperature = weatherData.current.temp_c;
            const humidity = weatherData.current.humidity;
            const windSpeed = weatherData.current.wind_kph;
            updateWeatherInfo(temperature, humidity, windSpeed);

            // Fetch geocode data
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

function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.003;
    renderer.render(scene, camera);
}

animate();
