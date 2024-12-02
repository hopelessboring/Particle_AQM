///// Event Listeners for initial load and click detection //////

document.addEventListener('DOMContentLoaded', function () {

  clearChart();  // Clear existing chart
  createD3Chart({
    containerId: "#air_quality_monitor",
    dataFilePath: "./pm2_d3datafile.csv",
    xAxisLabel: "Time",
    yAxisLabel: "Micrograms Per Cubic Meter (μg/m³)",
    lineColor: "black",
    safeThreshold: 30,
    moderateThreshold: 60,
    unhealthyThreshold: 110
  });
  console.log('PM2 link clicked!');

});

///// Clears the air qual monitor container upon click //////
function clearChart() {
  const airQualityMonitor = document.getElementById('air_quality_monitor');
  airQualityMonitor.innerHTML = '';
}