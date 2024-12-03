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
        latestData.forEach(reading => {
            const glowIntensity = reading.glowIntensity || 7; // Example value
            const pulseSpeed = reading.pulseSpeed || 20; // Example value

            // Update the glowing-circle animation duration
            const glowingCircle = document.querySelector('.glowing-circle');
            if (glowingCircle) {
                glowingCircle.style.animationDuration = `${glowIntensity / 7}s`;
            }

            // Update the pulse animation duration
            const innerCircle = document.querySelector('.inner');
            if (innerCircle) {
                innerCircle.style.animationDuration = `${pulseSpeed}s`;
            }

            if (maxSubIndex >= 300) {
                // Change outer circle glow colors
                glowingCircle.style.setProperty('--glow-color-1', '#fff');
                glowingCircle.style.setProperty('--glow-color-2', '#f0f');
                glowingCircle.style.setProperty('--glow-color-3', '#00ffff');
                glowingCircle.style.setProperty('--glow-color-4', '#e60073');

                // Change inner circle glow color
                innerCircle.style.setProperty('--inner-glow-color', '#FF6C00');
            }

            if (maxSubIndex >= 100 && maxSubIndex < 300) {
                // Change outer circle glow colors
                glowingCircle.style.setProperty('--glow-color-1', '#fff');
                glowingCircle.style.setProperty('--glow-color-2', '#f0f');
                glowingCircle.style.setProperty('--glow-color-3', '#00ffff');
                glowingCircle.style.setProperty('--glow-color-4', '#e60073');

                // Change inner circle glow color
                innerCircle.style.setProperty('--inner-glow-color', '#FF6C00');
            }

            if (maxSubIndex < 100) {
                // Change outer circle glow colors
                glowingCircle.style.setProperty('--glow-color-1', '#fff');
                glowingCircle.style.setProperty('--glow-color-2', '#f0f');
                glowingCircle.style.setProperty('--glow-color-3', '#00ffff');
                glowingCircle.style.setProperty('--glow-color-4', '#e60073');

                // Change inner circle glow color
                innerCircle.style.setProperty('--inner-glow-color', '#FF6C00');
            }

        });
    } catch (error) {
        console.error('Error updating styles:', error);
    }
}

// Start the polling
startDataPolling();