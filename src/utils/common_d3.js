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
  // Get the air_quality_monitor container
  const monitorElement = document.querySelector(containerId);

  // Create function to update dimensions
  const updateChart = () => {
    // Clear existing SVG
    d3.select(containerId).select("svg").remove();

    // Get the computed styles of the element
    const computedStyle = getComputedStyle(monitorElement);
    const containerWidth = parseInt(computedStyle.width, 10);
    const containerHeight = parseInt(computedStyle.height, 10);

    // Set minimum dimensions to prevent the chart from breaking
    const width = Math.max(containerWidth, 300);  // minimum width of 300px
    const height = Math.max(containerHeight, 200); // minimum height of 200px

    // Define margins and chart dimensions
    const margin = { top: 20, right: 100, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create the SVG with explicit dimensions
    const svg = d3.select(containerId).append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("max-width", "100%")
      .style("height", "auto");

    // Create a group for the chart content with margins
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load the CSV file using D3 v7
    d3.csv("./src/utils/pm2_d3datafile.csv").then(function (data) {
      // Parse the date and time down to the minute
      const parseTime = d3.timeParse("%Y-%m-%d-%H-%M");

      // Format the data
      data.forEach(function (d) {
        d.date = parseTime(d.date);
        d.value = +d.value; // Convert value to number
      });

      const startTime = new Date(2024, 9, 1, 8, 0);
      const endTime = new Date(2024, 9, 2, 0, 0);

      // Create the X axis (time)
      const x = d3.scaleTime()
        .domain([startTime, endTime])
        .range([0, chartWidth]);

      // Append the X axis
      chartGroup.append("g")
        .attr("transform", "translate(0," + (chartHeight - margin.top - margin.bottom) + ")")
        .call(d3.axisBottom(x).ticks(d3.timeHour.every(2)).tickFormat(d3.timeFormat("%I %p")))
        .attr("color", "#F0F0F0");  // Light gray for dark background

      // Add Y axis label
      chartGroup.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 10)
        .attr("fill", "#F0F0F0")  // Light gray for dark background
        .text(yAxisLabel);

      // Get the maximum value in the dataset
      const max = d3.max(data, d => +d.value);

      // Create the Y axis
      const y = d3.scaleLinear()
        .domain([0, max])
        .range([chartHeight - margin.top - margin.bottom, 0]);

      // Append the Y axis
      chartGroup.append("g")
        .call(d3.axisLeft(y))
        .attr("color", "#F0F0F0");  // Light gray for dark background

      // Append the safe threshold line
      chartGroup.append("line")
        .attr("class", "horizontal-line")
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", y(safeThreshold))
        .attr("y2", y(safeThreshold))
        .attr("stroke", "#B2B2B2")  // Slightly darker gray for lines
        .attr("stroke-dasharray", "4,4");  // Optional: makes lines dashed

      chartGroup.append("text")
        .attr("class", "safe-label")
        .attr("x", chartWidth + 20)  // Position in right margin with 5px offset
        .attr("y", y(safeThreshold - 2))
        .attr("fill", "#B2B2B2")  // Slightly darker gray for labels
        .html(`Safe<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);

      // Append the moderate threshold line
      chartGroup.append("line")
        .attr("class", "horizontal-line")
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", y(moderateThreshold))
        .attr("y2", y(moderateThreshold))
        .attr("stroke", "#B2B2B2")  // Slightly darker gray for lines
        .attr("stroke-dasharray", "4,4");  // Optional: makes lines dashed

      chartGroup.append("text")
        .attr("class", "moderate-label")
        .attr("x", chartWidth + 20)  // Position in right margin with 5px offset
        .attr("y", y(moderateThreshold - 2))
        .attr("fill", "#B2B2B2")  // Slightly darker gray for labels
        .html(`Moderate<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);

      // Append the unhealthy threshold line
      chartGroup.append("line")
        .attr("class", "horizontal-line")
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", y(unhealthyThreshold))
        .attr("y2", y(unhealthyThreshold))
        .attr("stroke", "#B2B2B2")  // Slightly darker gray for lines
        .attr("stroke-dasharray", "4,4");  // Optional: makes lines dashed

      chartGroup.append("text")
        .attr("class", "unhealthy-label")
        .attr("x", chartWidth + 20)
        .attr("y", y(unhealthyThreshold - 2))
        .attr("fill", "#B2B2B2")
        .html(`Unhealthy<tspan x='${chartWidth + 20}' dy='1.2em'>Level</tspan>`);


      // Add gradient for the line
      chartGroup.append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", y(0))
        .attr("x2", 0)
        .attr("y2", y(max))
        .selectAll("stop")
        .data([{ offset: "0%", color: "red" }, { offset: "100%", color: "blue" }])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

      // Add the line path
      chartGroup.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "url(#line-gradient)")
        .attr("stroke-width", 2)
        .attr("d", d3.line().x(d => x(d.date)).y(d => y(d.value)));
    }).catch(function (error) {
      console.error("Error loading data: ", error);
    });
  };

  // Initial chart creation
  updateChart();

  // Add resize listener
  window.addEventListener('resize', updateChart);
}