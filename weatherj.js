// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a sphere geometry for the Earth
const geometry = new THREE.SphereGeometry(5, 32, 32);

// Load texture for the Earth
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('worldmap.jpg'); // Assuming you have a 'worldmap.jpg' file

// Create a material with the Earth texture
const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });

// Create a mesh with the geometry and material for the Earth
const earth = new THREE.Mesh(geometry, earthMaterial);
scene.add(earth);

// Position the camera to view the Earth
camera.position.z = 15;

// Add lighting to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// Load space background texture for the skybox
const spaceTexture = textureLoader.load('space.jpg'); // Assuming you have a 'space.jpg' file

// Create a cube geometry for the skybox
const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

// Create a material with the space texture for the skybox
const skyMaterial = new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide });

// Create a mesh with the geometry and material for the skybox
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

// Variables to track mouse movement
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Function to handle zooming
function handleZoom(event) {
    // Prevent the default browser zoom behavior
    event.preventDefault();

    // Adjust camera position based on scroll direction
    if (event.deltaY < 0) {
        // Zoom in
        camera.position.z -= 1;
    } else {
        // Zoom out
        camera.position.z += 1;
    }
}

// Add event listener for mouse wheel
document.addEventListener('wheel', handleZoom, { passive: false });

// Function to handle mouse down event
function handleMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
}

// Function to handle mouse up event
function handleMouseUp(event) {
    isDragging = false;
}

// Function to handle mouse move event
function handleMouseMove(event) {
    if (isDragging) {
        const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };
        earth.rotation.x += deltaMove.y * 0.01;
        earth.rotation.y += deltaMove.x * 0.01;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
}

// Add event listeners for mouse events
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousemove', handleMouseMove);

// Function to animate the globe
function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.003; // Rotate the Earth
    renderer.render(scene, camera);
}

animate();
