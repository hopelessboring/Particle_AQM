// Import necessary functions
import { getLatestAirQualityData, getAirQualityDataByTimeRange } from './firebase.js';
import { breakpoints, calculateSubIndex } from './utils/air-quality.js';
import { updateRiskText } from './riskText.js';
import { createD3Chart, fetchDataAndUpdateChart } from './utils/d3_charts.js';

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

// Define core colors with their AQI ranges
const AQI_COLOR_RANGES = {
    GOOD: { min: 0, max: 50 },
    MODERATE: { min: 51, max: 100 },
    SENSITIVE: { min: 101, max: 150 },
    UNHEALTHY: { min: 151, max: 200 },
    VERY_UNHEALTHY: { min: 201, max: 300 },
    HAZARDOUS: { min: 301, max: 500 }
};

// Define color configuration for each range
const COLOR_CONFIG = {
    GOOD: {
        primary: [80, 120, 121],      // Blue/Green - AWESOME
        glow: {
            opacity: 0.6,
            pulseSpeed: 20
        }
    },
    MODERATE: {
        primary: [121, 109, 80],    // Yellow
        glow: {
            opacity: 0.7,
            pulseSpeed: 16
        }
    },
    SENSITIVE: {
        primary: [121, 94, 80],    // Orange
        glow: {
            opacity: 0.8,
            pulseSpeed: 12
        }
    },
    UNHEALTHY: {
        primary: [121, 80, 80], // Dark Red faded
        glow: {
            opacity: 0.85,
            pulseSpeed: 8
        }
    },
    VERY_UNHEALTHY: {
        primary: [255, 69, 0],     // Red

        glow: {
            opacity: 0.9,
            pulseSpeed: 4
        }
    },
    HAZARDOUS: {
        primary: [255, 0, 0],      // Dark Red
        glow: {
            opacity: 1,
            pulseSpeed: 2
        }
    }
};

function getRangeForAQI(aqi) {
    for (const [range, values] of Object.entries(AQI_COLOR_RANGES)) {
        if (aqi >= values.min && aqi <= values.max) {
            return range;
        }
    }
    return 'HAZARDOUS'; // Default for any value above 500
}

function updateVisualElements(aqi) {
    const glowingCircle = document.querySelector('.glowing-circle');
    const innerCircle = document.querySelector('.inner');

    if (!glowingCircle || !innerCircle) return;

    const range = getRangeForAQI(aqi);
    const config = COLOR_CONFIG[range];
    const baseColor = `rgb(${config.primary.join(',')})`;

    // Update glow colors with variations
    glowingCircle.style.setProperty('--glow-color-1', baseColor);
    glowingCircle.style.setProperty('--glow-color-2', adjustBrightness(baseColor, 1.1));
    glowingCircle.style.setProperty('--glow-color-3', adjustBrightness(baseColor, 0.9));
    glowingCircle.style.setProperty('--glow-color-4', adjustBrightness(baseColor, 0.8));

    // Update inner circle
    innerCircle.style.setProperty('--inner-glow-color', baseColor);
    innerCircle.style.setProperty('--glow-opacity', config.glow.opacity);
    innerCircle.style.setProperty('--pulse-speed', `${config.glow.pulseSpeed}s`);
}

function adjustBrightness(color, factor) {
    // Extract RGB values from the color string
    const rgb = color.match(/\d+/g).map(Number);

    // Adjust each component by the factor
    const adjusted = rgb.map(value => {
        const newValue = Math.round(value * factor);
        return Math.min(255, Math.max(0, newValue)); // Clamp between 0 and 255
    });

    return `rgb(${adjusted[0]}, ${adjusted[1]}, ${adjusted[2]})`;
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
        // need to generate a better method to calculate AQI from the subindices (range of 0-500)
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
        const riskDescriptionElement = document.getElementById('riskDescription');

        if (!glowingCircle || !innerCircle) return;

        latestData.forEach(reading => {
            const glowIntensity = reading.glowIntensity || 7;
            const pulseSpeed = reading.pulseSpeed || 20;

            // Update animation durations
            glowingCircle.style.animationDuration = `${glowIntensity / 7}s`;
            innerCircle.style.animationDuration = `${pulseSpeed}s`;

            // Update visual elements using the new function
            updateVisualElements(window.maxAQI);

            // Determine risk level and description based on AQI
            let riskLevel;
            let riskDescription;

            if (window.maxAQI <= 50) {
                riskLevel = 'Good Air Quality';
                riskDescription = 'Air quality is satisfactory, and air pollution poses little or no risk.';
            } else if (window.maxAQI <= 100) {
                riskLevel = 'Moderate Risk';
                riskDescription = 'Air quality is acceptable; however, there may be a moderate health concern for a very small number of people.';
            } else if (window.maxAQI <= 150) {
                riskLevel = 'Unhealthy for Sensitive Groups';
                riskDescription = 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.';
            } else if (window.maxAQI <= 200) {
                riskLevel = 'Unhealthy';
                riskDescription = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.';
            } else if (window.maxAQI <= 300) {
                riskLevel = 'Very Unhealthy';
                riskDescription = 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
            } else {
                riskLevel = 'Hazardous';
                riskDescription = 'Health alert: everyone may experience more serious health effects. Take immediate action to protect yourself.';
            }

            // Update the risk description text
            if (riskDescriptionElement) {
                riskDescriptionElement.textContent = riskDescription;
            }

            // Determine dominant pollutant
            const pollutants = {
                'PM2.5': reading.pm2_5,
                'PM10': reading.pm10,
                'TVOC': reading.TVOC,
                'eCO₂': reading.eCO2
            };

            const highestValue = Math.max(...Object.values(pollutants));
            const dominantPollutant = Object.entries(pollutants).find(([key, value]) => value === highestValue)[0];

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

    } catch (error) {
        console.error('Error updating styles:', error);
    }
}

// Move this to the end of the file
startDataPolling();