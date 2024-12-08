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
  unhealthyThreshold,
  width,
  height,
  reports
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
      sampleMaxAQI: dataFilePath[0]?.maxAQI
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

        // Use maxAQI value
        const value = d.maxAQI;

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
      .domain([0, Math.max(d3.max(validData, d => d.value), unhealthyThreshold)])
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
      { value: safeThreshold, label: 'Good' },
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

    // Add report markers if they exist
    if (reports && reports.length > 0) {
      const reportGroup = svg.append("g")
        .attr("class", "report-markers");

      // Add vertical lines for reports
      reportGroup.selectAll(".report-line")
        .data(reports)
        .enter()
        .append("line")
        .attr("class", "report-line")
        .attr("x1", d => x(d.date))
        .attr("x2", d => x(d.date))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#FF4444")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");

      // Add markers
      const markers = reportGroup.selectAll(".report-marker")
        .data(reports)
        .enter()
        .append("g")
        .attr("class", "report-marker")
        .attr("transform", d => `translate(${x(d.date)},${height - margin.bottom})`);

      // Add marker circles
      markers.append("circle")
        .attr("r", 6)
        .attr("fill", "#FF4444")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer");

      // Add tooltip behavior
      markers.append("title")
        .text(d => `${d.title}\n${new Date(d.date).toLocaleTimeString()}`);

      // Add click behavior
      markers.on("click", function (event, d) {
        event.stopPropagation();

        // Remove any existing detail boxes
        d3.selectAll(".report-detail-box").remove();

        // Calculate position relative to the viewport
        const mouseX = event.pageX;
        const mouseY = event.pageY;

        // Create detail box
        const detailBox = d3.select("body")
          .append("div")
          .attr("class", "report-detail-box")
          .style("left", `${mouseX + 10}px`)
          .style("top", `${mouseY - 10}px`);

        // Add content to detail box
        detailBox.html(`
          <h4>${d.title}</h4>
          <p class="time"><strong>Time:</strong> ${new Date(d.date).toLocaleString()}</p>
          <p class="description">${d.description}</p>
          <p class="reporter">Reported by: ${d.fullName}</p>
        `);

        // Close detail box when clicking outside
        d3.select("body").on("click.detail", function (event) {
          if (!event.target.closest(".report-detail-box") &&
            !event.target.closest("circle")) {
            detailBox.remove();
            d3.select("body").on("click.detail", null);
          }
        });
      });
    }
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
    yAxisLabel: "Air Quality Index",
    lineColor: "#4CAF50",
    safeThreshold: 50,      // Good
    moderateThreshold: 100, // Moderate
    unhealthyThreshold: 150 // Unhealthy
  };

  console.log('Chart configuration:', chartConfig);
  createD3Chart(chartConfig);
}