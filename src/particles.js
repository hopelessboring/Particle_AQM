// Get the canvas and create the engine
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Declare particleSystem at the top level so it's accessible everywhere
let particleSystem;
let camera;
window.camera = camera;

// Global variable to store maximum AQI
window.maxAQI = null;

// Functions to map AQI to color, emit rate, and speed
function getColorFromAQI(aqi) {
    // Clamp AQI value between 0 and 500
    aqi = Math.min(Math.max(aqi, 0), 500);

    // Normalize AQI to a value between 0 and 1
    let normalizedAQI = aqi / 500;

    // Define start and end colors
    let healthyColor = { r: 17 / 25, g: 21 / 25, b: 230 / 255 }; // Light blue
    let hazardousColor = { r: 225 / 255, g: 10 / 30, b: 10 / 30 }; // Deep pink

    // Create two slightly different colors for depth
    let r = healthyColor.r + (hazardousColor.r - healthyColor.r) * normalizedAQI;
    let g = healthyColor.g + (hazardousColor.g - healthyColor.g) * normalizedAQI;
    let b = healthyColor.b + (hazardousColor.b - healthyColor.b) * normalizedAQI;

    // Return an object with two color variations
    return {
        color1: new BABYLON.Color4(r, g, b, 1.0),
        color2: new BABYLON.Color4(r * 0.7, g * 0.7, b * 0.8, 1.0) // Slightly darker/cooler variant
    };
}

function getEmitRateFromAQI(aqi) {
    let minEmitRate = 5;
    let maxEmitRate = 300;
    let normalizedAQI = aqi / 500;
    return minEmitRate + (maxEmitRate - minEmitRate) * normalizedAQI;
}

function getSpeedFromAQI(aqi) {
    let minSpeed = 0.2;
    let maxSpeed = 3.0;
    let normalizedAQI = aqi / 500;
    return minSpeed + (maxSpeed - minSpeed) * normalizedAQI;
}

async function initScene() {
    console.log('Initializing scene...');
    // Wait for initial data
    while (window.maxAQI === null) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('maxAQI received:', window.maxAQI);

    // Now create the scene
    const scene = await createScene();
    console.log('Scene created:', scene);

    // Start render loop
    engine.runRenderLoop(function () {
        updateParticleSystem();
        scene.render();
    });
    console.log('Render loop started');
}

async function createScene() {
    console.log('Creating scene...');
    var scene = new BABYLON.Scene(engine);

    // Set the scene's clear color to #282828
    scene.clearColor = new BABYLON.Color4(0.157, 0.157, 0.157, 1.0); // RGB values for #282828

    var light0 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 2, 8), scene);
    camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", Math.PI / 2, Math.PI / 2, 5, new BABYLON.Vector3(0, 0, 0), scene);
    // no control of the camera in the browser
    // camera.attachControl(canvas, false);
    window.camera = camera;

    // Create a particle system
    console.log('Creating particle system...');
    particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);

    // Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("./src/textures/flare.png", scene);

    // Where the particles come from
    particleSystem.emitter = BABYLON.Vector3.Zero();

    // Initial particle colors
    let initialColors = getColorFromAQI(window.maxAQI || 0);
    particleSystem.color1 = initialColors.color1;
    particleSystem.color2 = initialColors.color2;
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    // Size of each particle
    particleSystem.minSize = 0.075;
    particleSystem.maxSize = 0.35;

    // Life time of each particle
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 3;

    // Emission rate
    particleSystem.emitRate = getEmitRateFromAQI(window.maxAQI || 0);

    // Emission Space
    particleSystem.createCylinderEmitter(1, 1, 0, 0);

    // Initial Speed
    let speed = getSpeedFromAQI(window.maxAQI || 0);
    particleSystem.minEmitPower = speed;
    particleSystem.maxEmitPower = speed + 1;
    particleSystem.updateSpeed = 0.005;

    // Start the particle system
    particleSystem.start();
    console.log('Particle system started');

    return scene;
}

// Start the init function
console.log('Starting initialization...');
initScene();

// Function to update particle system properties
function updateParticleSystem() {
    if (window.maxAQI === null) return;

    let colors = getColorFromAQI(window.maxAQI);
    particleSystem.color1 = colors.color1;
    particleSystem.color2 = colors.color2;
    particleSystem.emitRate = getEmitRateFromAQI(window.maxAQI);
    let speed = getSpeedFromAQI(window.maxAQI);
    particleSystem.minEmitPower = speed;
    particleSystem.maxEmitPower = speed + 1;
}

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});