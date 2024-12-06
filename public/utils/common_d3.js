// Add this at the top of the file
window.createD3Chart = createD3Chart;

// Export the functions that need to be used in other files
export function createD3Chart({
  containerId,
  dataFilePath,
  xAxisLabel,
  yAxisLabel,
  lineColor,
  safeThreshold,
  moderateThreshold,
  unhealthyThreshold
}) {
  const element = document.querySelector(containerId);
  if (!element) {
    console.error('Invalid element passed to updateChart');
    return;
  }

  function updateChart() {
    d3.select(containerId).select("svg").remove();

    const computedStyle = getComputedStyle(element);
    const containerWidth = parseInt(computedStyle.width, 10);
    const containerHeight = parseInt(computedStyle.height, 10);

    const width = Math.max(containerWidth, 300);
    const height = Math.max(containerHeight, 200);

    const margin = { top: 20, right: 100, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(containerId).append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("max-width", "100%")
      .style("height", "auto");

    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const parseTime = d3.timeParse("%Y-%m-%d-%H-%M");

    dataFilePath.forEach(function (d) {
      d.date = new Date(d.timestamp);
      d.value = +d.pm2_5;
    });

    const x = d3.scaleTime()
      .domain(d3.extent(dataFilePath, d => d.date))
      .range([0, chartWidth]);

    chartGroup.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(d3.timeHour.every(2)).tickFormat(d3.timeFormat("%I %p")))
      .attr("color", "#F0F0F0");

    chartGroup.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -margin.left + 10)
      .attr("fill", "#F0F0F0")
      .text(yAxisLabel);

    const max = d3.max(dataFilePath, d => +d.value);

    const y = d3.scaleLinear()
      .domain([0, max])
      .range([chartHeight, 0]);

    chartGroup.append("g")
      .call(d3.axisLeft(y))
      .attr("color", "#F0F0F0");

    chartGroup.append("line")
      .attr("class", "horizontal-line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", y(safeThreshold))
      .attr("y2", y(safeThreshold))
      .attr("stroke", "#B2B2B2")
      .attr("stroke-dasharray", "4,4");

    chartGroup.append("text")
      .attr("class", "safe-label")
      .attr("x", chartWidth + 20)
      .attr("y", y(safeThreshold))
      .attr("fill", "#B2B2B2")
      .html(`Safe<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);

    chartGroup.append("line")
      .attr("class", "horizontal-line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", y(moderateThreshold))
      .attr("y2", y(moderateThreshold))
      .attr("stroke", "#B2B2B2")
      .attr("stroke-dasharray", "4,4");

    chartGroup.append("text")
      .attr("class", "moderate-label")
      .attr("x", chartWidth + 20)
      .attr("y", y(moderateThreshold))
      .attr("fill", "#B2B2B2")
      .html(`Moderate<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);

    chartGroup.append("line")
      .attr("class", "horizontal-line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", y(unhealthyThreshold))
      .attr("y2", y(unhealthyThreshold))
      .attr("stroke", "#B2B2B2")
      .attr("stroke-dasharray", "4,4");

    chartGroup.append("text")
      .attr("class", "unhealthy-label")
      .attr("x", chartWidth + 20)
      .attr("y", y(unhealthyThreshold))
      .attr("fill", "#B2B2B2")
      .html(`Unhealthy<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);

    chartGroup.append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", 0)
      .attr("y2", y(max))
      .selectAll("stop")
      .data([
        { offset: "0%", color: "green" },
        { offset: "50%", color: "yellow" },
        { offset: "100%", color: "red" }
      ])
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    chartGroup.append("path")
      .datum(dataFilePath)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value)));
  }

  updateChart();
  window.addEventListener('resize', updateChart);
}

export function createSingleMetricChart(element, data, metric) {
  console.log('Creating single metric chart:', {
    element: element,
    elementId: element?.id,
    dataLength: data?.length,
    metric: metric
  });

  if (!element || !element.id) {
    console.error('Invalid element passed to createSingleMetricChart:', element);
    return;
  }

  const chartConfig = {
    containerId: `#${element.id}`,
    dataFilePath: data,
    xAxisLabel: "Time",
    yAxisLabel: `${metric.toUpperCase()} Level`,
    lineColor: "#4CAF50",
    safeThreshold: 12,
    moderateThreshold: 35.4,
    unhealthyThreshold: 55.4
  };

  console.log('Chart configuration:', chartConfig);
  createD3Chart(chartConfig);
}