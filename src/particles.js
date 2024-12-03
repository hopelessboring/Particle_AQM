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
    // Wait for initial data
    while (window.maxAQI === null) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Now create the scene
    const scene = await createScene();

    // Start render loop
    engine.runRenderLoop(function () {
        updateParticleSystem();
        scene.render();
    });
}

async function createScene() {
    var scene = new BABYLON.Scene(engine);

    // Setup environment
    scene.clearColor = new BABYLON.Color3(0, 0, 0); // Set background to black
    var light0 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 2, 8), scene);
    camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, .9, 14.186, new BABYLON.Vector3(0, 0, 0), scene); //sets initial camera position
    camera.attachControl(canvas, true);
    window.camera = camera;

    console.log(`Alpha: ${camera.alpha}`);
    console.log(`Beta: ${camera.beta}`);
    console.log(`Radius: ${camera.radius}`);

    //Sphere around emitter
    var sphere = BABYLON.MeshBuilder.CreateCylinder("sphere", { height: 1, diameter: 2 }, scene);
    sphere.material = new BABYLON.StandardMaterial("mat", scene);
    sphere.material.wireframe = true;
    sphere.material.alpha = 0;

    // Create a particle system
    particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);

    // Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("./src/textures/flare.png", scene, false, false, null, function () {
        console.log("Texture loaded successfully");
    }, function (err) {
        console.error("Failed to load texture:", err);
    });

    // Where the particles come from
    particleSystem.emitter = BABYLON.Vector3.Zero(); // the starting location

    // Initial particle colors
    let initialColors = getColorFromAQI(window.maxAQI || 0);
    particleSystem.color1 = initialColors.color1;
    particleSystem.color2 = initialColors.color2;
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0); // Transparent

    // Size of each particle (random between...)
    particleSystem.minSize = 0.075;
    particleSystem.maxSize = 0.35;

    // Life time of each particle (random between...)
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 3;

    // Initial emission rate
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

    return scene;
}

// Start the init function
initScene();

// Function to update particle system properties
function updateParticleSystem() {
    // Ensure maxAQI is available
    if (window.maxAQI === null) {
        return;
    }

    // Get colors based on AQI
    let colors = getColorFromAQI(window.maxAQI);

    // Update particle colors
    particleSystem.color1 = colors.color1;
    particleSystem.color2 = colors.color2;

    // Update emit rate
    particleSystem.emitRate = getEmitRateFromAQI(window.maxAQI);

    // Update particle speed
    let speed = getSpeedFromAQI(window.maxAQI);
    particleSystem.minEmitPower = speed;
    particleSystem.maxEmitPower = speed + 1;
}

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});