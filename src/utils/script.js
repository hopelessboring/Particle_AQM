import { createD3Chart } from './d3_charts.js';

///// Event Listeners for initial load and click detection //////

document.addEventListener('DOMContentLoaded', function () {
  // Only run if the air_quality_monitor element exists
  const airQualityMonitor = document.getElementById('air_quality_monitor');
  if (airQualityMonitor) {
    clearChart();  // Clear existing chart
    createD3Chart({
      containerId: "#air_quality_monitor",
      // dataFilePath: "/src/utils/pm2_d3datafile.csv",
      xAxisLabel: "Time",
      yAxisLabel: "Micrograms Per Cubic Meter (μg/m³)",
      lineColor: "black",
      safeThreshold: 30,
      moderateThreshold: 60,
      unhealthyThreshold: 110
    });
    console.log('PM2 link clicked!');
  }
});

///// Clears the air qual monitor container upon click //////
function clearChart() {
  const airQualityMonitor = document.getElementById('air_quality_monitor');
  if (airQualityMonitor) {  // Only clear if element exists
    airQualityMonitor.innerHTML = '';
  }
}