// sun.js

function createSun() {
    // Create a sphere geometry for the Sun
    const sunGeometry = new THREE.SphereGeometry(10, 64, 64); // Increase segments for smoother surface
    const sunTexture = new THREE.TextureLoader().load('sun_texture.jpg'); // Load texture for the Sun
    const sunMaterial = new THREE.MeshStandardMaterial({ map: sunTexture }); // Use a standard material with texture
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);

    return sun;
}
