// Import necessary functions
import { getLatestAirQualityData, getAirQualityDataByTimeRange } from './firebase.js';
import { breakpoints, calculateSubIndex } from './utils/air-quality.js';

// Global variables
window.tvoc = null;
window.eco2 = null;
window.pm10 = null;
window.pm1_0 = null;
window.pm2_5 = null;
window.timestamp = null;
window.maxAQI = null;

// Add this near the top with your other window variables
Object.defineProperty(window, 'maxAQI', {
    set: function (value) {
        this._maxAQI = value;
        updateStyles();
    },
    get: function () {
        return this._maxAQI || 0;  // Default to 0 if not set
    }
});

// Define core colors 
const CORE_COLORS = {
    safe: [0, 255, 128],      // A soft green
    moderate: [255, 223, 0],   // A warm yellow
    warning: [255, 140, 0],    // A bright orange
    danger: [255, 69, 0],      // A vibrant red
    severe: [128, 0, 128],     // A deep purple
    hazardous: [128, 0, 0]     // A dark red
};

function interpolateColor(color1, color2, factor) {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
    }
    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

function getColorForAQI(aqi) {
    if (aqi <= 50) {
        return interpolateColor(CORE_COLORS.safe, CORE_COLORS.moderate, aqi / 50);
    } else if (aqi <= 100) {
        return interpolateColor(CORE_COLORS.moderate, CORE_COLORS.warning, (aqi - 50) / 50);
    } else if (aqi <= 200) {
        return interpolateColor(CORE_COLORS.warning, CORE_COLORS.danger, (aqi - 100) / 100);
    } else if (aqi <= 300) {
        return interpolateColor(CORE_COLORS.danger, CORE_COLORS.severe, (aqi - 200) / 100);
    } else if (aqi <= 500) {
        return interpolateColor(CORE_COLORS.severe, CORE_COLORS.hazardous, (aqi - 300) / 200);
    }
    return `rgb(${CORE_COLORS.hazardous[0]}, ${CORE_COLORS.hazardous[1]}, ${CORE_COLORS.hazardous[2]})`;
}

// Example async function to fetch and display data
async function displayAirQualityData() {
    try {
        // Get latest reading
        const latestData = await getLatestAirQualityData(1);
        latestData.forEach(reading => {
            tvoc = reading.TVOC;
            eco2 = reading.eCO2;
            pm10 = reading.pm10;
            pm1_0 = reading.pm1_0;
            pm2_5 = reading.pm2_5;
            timestamp = reading.timestamp;
        });

        // Calculate sub-indices
        const subIndexPM1_0 = calculateSubIndex(pm1_0, 'pm1_0');
        const subIndexPM2_5 = calculateSubIndex(pm2_5, 'pm25');
        const subIndexPM10 = calculateSubIndex(pm10, 'pm10');
        const subIndexTVOC = calculateSubIndex(tvoc, 'tvoc');
        const subIndexeCO2 = calculateSubIndex(eco2, 'eco2');

        // Calculate maximum sub-index
        const maxSubIndex = Math.max(subIndexPM1_0, subIndexPM2_5, subIndexPM10, subIndexTVOC, subIndexeCO2);
        window.maxAQI = maxSubIndex;

        // Output the results
        console.log('Latest readings:', latestData);

        console.log(`
        TVOC: ${tvoc} ppb, 
        eCO2: ${eco2} ppm,
        PM10: ${pm10} µg/m³,
        PM1.0: ${pm1_0} µg/m³,
        PM2.5: ${pm2_5} µg/m³,
        Timestamp: ${new Date(timestamp)}
        `);

        console.log(`
        Sub-Indices:
        PM1.0 Index: ${subIndexPM1_0}
        PM2.5 Index: ${subIndexPM2_5}
        PM10 Index: ${subIndexPM10}
        TVOC Index: ${subIndexTVOC}
        eCO₂ Index: ${subIndexeCO2}
        `);

        console.log(`Overall AQI (Maximum Sub-Index): ${maxSubIndex}`);

        // Update styles based on the latest data
        await updateStyles();

        // Update your UI here with the AQI and pollutant data

    } catch (error) {
        console.error('Error:', error);
    }
}

async function startDataPolling() {
    // Initial call
    await displayAirQualityData();

    // Call every 30 seconds
    setInterval(async () => {
        await displayAirQualityData();
    }, 30000);
}

async function updateStyles() {
    try {
        const latestData = await getLatestAirQualityData(1);
        const glowingCircle = document.querySelector('.glowing-circle');
        const innerCircle = document.querySelector('.inner');

        if (!glowingCircle || !innerCircle) return;

        latestData.forEach(reading => {
            const glowIntensity = reading.glowIntensity || 7;
            const pulseSpeed = reading.pulseSpeed || 20;

            // Update animation durations
            glowingCircle.style.animationDuration = `${glowIntensity / 7}s`;
            innerCircle.style.animationDuration = `${pulseSpeed}s`;

            // Get interpolated color based on AQI
            const color = getColorForAQI(window.maxAQI);

            // Apply colors with slight variations for visual interest
            glowingCircle.style.setProperty('--glow-color-1', color);
            glowingCircle.style.setProperty('--glow-color-2', color);
            glowingCircle.style.setProperty('--glow-color-3', color);
            glowingCircle.style.setProperty('--glow-color-4', color);
            innerCircle.style.setProperty('--inner-glow-color', color);

            // Determine risk level based on AQI
            let riskLevel;
            let dominantPollutant = '';

            if (window.maxAQI <= 50) {
                riskLevel = 'Good Air Quality';
            } else if (window.maxAQI <= 100) {
                riskLevel = 'Moderate Risk';
            } else if (window.maxAQI <= 150) {
                riskLevel = 'Unhealthy for Sensitive Groups';
            } else if (window.maxAQI <= 200) {
                riskLevel = 'Unhealthy';
            } else if (window.maxAQI <= 300) {
                riskLevel = 'Very Unhealthy';
            } else {
                riskLevel = 'Hazardous';
            }

            // Determine dominant pollutant
            const pollutants = {
                'PM2.5': reading.pm2_5,
                'PM10': reading.pm10,
                'TVOC': reading.TVOC,
                'eCO₂': reading.eCO2
            };

            const highestValue = Math.max(...Object.values(pollutants));
            dominantPollutant = Object.entries(pollutants).find(([key, value]) => value === highestValue)[0];

            // Format the value string
            const valueString = `${Math.round(highestValue)} PPM ${dominantPollutant}`;

            // Update the annotation
            const riskLevelElement = document.querySelector('.risk-level');
            const riskValueElement = document.querySelector('.risk-value');

            if (riskLevelElement && riskValueElement) {
                riskLevelElement.textContent = riskLevel;
                riskValueElement.textContent = valueString;
            }
        });

        if (window.maxAQI >= 100 && window.maxAQI < 300) {
            // Change outer circle glow colors for Unhealthy to Very Unhealthy
            glowingCircle.style.setProperty('--glow-color-1', '#ff0'); // Yellow
            glowingCircle.style.setProperty('--glow-color-2', '#ffa500'); // Orange
            glowingCircle.style.setProperty('--glow-color-3', '#ff4500'); // Red
            glowingCircle.style.setProperty('--glow-color-4', '#800080'); // Purple

            // Change inner circle glow color
            innerCircle.style.setProperty('--inner-glow-color', '#ff4500'); // Red
        }

        if (window.maxAQI < 100) {
            // Change outer circle glow colors for Good to Moderate
            glowingCircle.style.setProperty('--glow-color-1', '#00ff00'); // Green
            glowingCircle.style.setProperty('--glow-color-2', '#ffff00'); // Yellow
            glowingCircle.style.setProperty('--glow-color-3', '#ffa500'); // Orange
            glowingCircle.style.setProperty('--glow-color-4', '#ff4500'); // Red

            // Change inner circle glow color
            innerCircle.style.setProperty('--inner-glow-color', '#00ff00'); // Green
        }
    } catch (error) {
        console.error('Error updating styles:', error);
    }
}

// Start the polling
startDataPolling();