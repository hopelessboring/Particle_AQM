window.createD3Chart = createD3Chart;
window.createSingleMetricChart = createSingleMetricChart;

function createD3Chart({
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
    // Debug data structure
    console.log('Data received in createD3Chart:', {
      firstPoint: dataFilePath[0],
      totalPoints: dataFilePath.length,
      sampleTimestamp: dataFilePath[0]?.timestamp,
      samplePM25: dataFilePath[0]?.pm2_5
    });

    d3.select(containerId).select("svg").remove();

    // Process data
    const validData = dataFilePath
      .map(d => {
        // Convert timestamp to Date
        let date;
        if (d.timestamp && typeof d.timestamp === 'object' && d.timestamp.seconds) {
          date = new Date(d.timestamp.seconds * 1000);
        } else if (d.timestamp) {
          date = new Date(d.timestamp);
        }

        // Convert PM2.5 to number
        const value = typeof d.pm2_5 === 'string' ? parseFloat(d.pm2_5) : d.pm2_5;

        console.log('Processing point:', {
          original: d,
          processed: { date, value }
        });

        return { date, value };
      })
      .filter(d => d.date && !isNaN(d.value));

    console.log('Processed data:', {
      totalValid: validData.length,
      firstValidPoint: validData[0]
    });

    if (validData.length === 0) {
      console.error('No valid data points after processing');
      return;
    }

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

    const x = d3.scaleTime()
      .domain(d3.extent(validData, d => d.date))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(validData, d => d.value)])
      .range([chartHeight, 0]);

    chartGroup.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(d3.timeHour.every(2)).tickFormat(d3.timeFormat("%I %p")))
      .attr("color", "#F0F0F0");

    chartGroup.append("g")
      .call(d3.axisLeft(y))
      .attr("color", "#F0F0F0");

    // Add threshold lines
    [
      { value: safeThreshold, label: 'Safe' },
      { value: moderateThreshold, label: 'Moderate' },
      { value: unhealthyThreshold, label: 'Unhealthy' }
    ].forEach(threshold => {
      chartGroup.append("line")
        .attr("class", "threshold-line")
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", y(threshold.value))
        .attr("y2", y(threshold.value))
        .attr("stroke", "#B2B2B2")
        .attr("stroke-dasharray", "4,4");

      chartGroup.append("text")
        .attr("class", "threshold-label")
        .attr("x", chartWidth + 20)
        .attr("y", y(threshold.value))
        .attr("fill", "#B2B2B2")
        .html(`${threshold.label}<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);
    });

    // Add line gradient
    const gradient = chartGroup.append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", 0)
      .attr("y2", y(d3.max(validData, d => d.value)));

    gradient.selectAll("stop")
      .data([
        { offset: "0%", color: "green" },
        { offset: "50%", color: "yellow" },
        { offset: "100%", color: "red" }
      ])
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    // Draw the line
    chartGroup.append("path")
      .datum(validData)
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

function createSingleMetricChart(element, data, metric) {
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