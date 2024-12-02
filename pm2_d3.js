document.addEventListener('DOMContentLoaded', function () {
  createD3Chart({
    containerId: "#air_quality_monitor",
    dataFilePath: "./pm2_d3datafile.csv",
    xAxisLabel: "Time",
    yAxisLabel: "Micrograms Per Cubic Meter (μg/m³)",
    lineColor: "red",
    safeThreshold: 40,
    moderateThreshold: 60,
    unhealthyThreshold: 110
  });
});
console.log('PM2 link clicked and data file loaded!');