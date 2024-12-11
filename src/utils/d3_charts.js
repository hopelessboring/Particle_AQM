import { getAirQualityDataByTimeRange, getReportsByTimeRange } from '../firebase.js';

// DOM Event Listener for initialization
document.addEventListener('DOMContentLoaded', () => {
    const chartElement = document.getElementById('air_quality_monitor');
    const dateSelector = document.getElementById('dateSelector');

    if (!chartElement || !dateSelector) {
        console.error('Chart element or date selector not found');
        return;
    }

    // Create metric selector
    const metricSelector = document.createElement('select');
    metricSelector.className = 'metric-selector';
    metricSelector.style.cssText = `
        margin-left: 10px;
        padding: 5px 10px;
        border-radius: 4px;
        border: 1px solid #ccc;
        background-color: white;
        color: black;
    `;

    // Add metric options
    const metrics = [
        { value: 'max_aqi', label: 'AQI General Index' },
        { value: 'pm1_0', label: 'PM1.0' },
        { value: 'pm2_5', label: 'PM2.5' },
        { value: 'pm10', label: 'PM10' },
        { value: 'eCO2', label: 'ECO2' },
        { value: 'TVOC', label: 'TVOC' }
    ];

    metrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric.value;
        option.textContent = metric.label;
        metricSelector.appendChild(option);
    });

    metricSelector.value = 'max_aqi';

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Update Chart';
    submitButton.className = 'btn btn-primary mt-2';
    submitButton.style.cssText = `
        margin-left: 10px;
        padding: 5px 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

    // Insert controls
    const container = dateSelector.parentNode;
    container.insertBefore(metricSelector, dateSelector.nextSibling);
    container.insertBefore(submitButton, metricSelector.nextSibling);

    // Set default date to EST
    const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    estDate.setHours(0, 0, 0, 0);
    const estFormattedDate = estDate.toISOString().split('T')[0];
    dateSelector.value = estFormattedDate;

    // Handle date selection
    const handleDateSelection = () => {
        const [year, month, day] = dateSelector.value.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day, 12, 0, 0);

        if (isNaN(selectedDate)) {
            console.error('Invalid date selected');
            return;
        }

        const options = {
            timeZone: 'America/New_York',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        const dateStr = selectedDate.toLocaleDateString('en-US', options);
        document.querySelector('.div4').textContent = `Recorded Data - ${dateStr}`;

        fetchDataAndUpdateChart(chartElement, selectedDate);
    };

    // Event listeners
    submitButton.addEventListener('click', handleDateSelection);
    dateSelector.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleDateSelection();
        }
    });
    metricSelector.addEventListener('change', handleDateSelection);

    // Initial load
    fetchDataAndUpdateChart(chartElement, estDate);
    document.querySelector('.div4').textContent = `Recorded Data - ${estDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })}`;
});

// Main D3 Chart Creation Function
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
    reports,
    timeExtent
}) {
    const element = document.querySelector(containerId);
    if (!element) {
        console.error('Invalid element passed to updateChart');
        return;
    }

    function updateChart() {
        d3.select(containerId).select("svg").remove();

        // Process data
        const validData = dataFilePath
            .map(d => {
                let date;
                if (d.timestamp && typeof d.timestamp === 'object' && d.timestamp.seconds) {
                    date = new Date(d.timestamp.seconds * 1000);
                } else if (d.timestamp) {
                    date = new Date(d.timestamp);
                }
                const value = d.maxAQI;
                return { date, value };
            })
            .filter(d => d.date && !isNaN(d.value));

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

        // Create SVG
        const svg = d3.select(containerId).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("max-width", "100%")
            .style("height", "auto");

        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const xDomain = timeExtent && timeExtent.forceFullDay
            ? [timeExtent.start, timeExtent.end]
            : d3.extent(validData, d => d.date);

        const x = d3.scaleTime()
            .domain(xDomain)
            .range([0, chartWidth]);

        const y = d3.scaleLinear()
            .domain([0, Math.max(d3.max(validData, d => d.value), unhealthyThreshold)])
            .range([chartHeight, 0]);

        // Add axes
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

        // Add report markers if available
        if (reports && reports.length > 0) {
            addReportMarkers(chartGroup, reports, x, y, margin, height);
        }
    }

    updateChart();
    window.addEventListener('resize', updateChart);
}

// Helper function to add report markers
function addReportMarkers(chartGroup, reports, x, y, margin, height) {
    const reportGroup = chartGroup.append("g")
        .attr("class", "report-markers");

    // Add vertical lines
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

    markers.append("circle")
        .attr("r", 6)
        .attr("fill", "#FF4444")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer");

    markers.append("title")
        .text(d => `${d.title}\n${new Date(d.date).toLocaleTimeString()}`);

    // Add click behavior
    markers.on("click", function (event, d) {
        event.stopPropagation();
        d3.selectAll(".report-detail-box").remove();

        const detailBox = d3.select("body")
            .append("div")
            .attr("class", "report-detail-box")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`)
            .html(`
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

// Data fetching and chart update function
async function fetchDataAndUpdateChart(element, selectedDate) {
    if (!element) {
        console.error('No valid chart element available');
        return;
    }

    const metricSelector = document.querySelector('.metric-selector');
    const selectedMetric = metricSelector ? metricSelector.value : 'max_aqi';

    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const startStr = startDate.toISOString();

    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);
    const endStr = endDate.toISOString();

    try {
        const [airData, reports] = await Promise.all([
            getAirQualityDataByTimeRange(startStr, endStr),
            getReportsByTimeRange(startStr, endStr)
        ]);

        if (!airData || airData.length === 0) {
            console.warn('No data returned from Firebase');
            element.innerHTML = '<p class="text-center">No data available for the selected date.</p>';
            return;
        }

        const processedData = airData.map(reading => ({
            ...reading,
            timestamp: reading.timestamp,
            maxAQI: reading[selectedMetric]
        }));

        const validData = processedData.filter(d =>
            d.timestamp &&
            typeof d.maxAQI === 'number' &&
            !isNaN(d.maxAQI)
        );

        if (validData.length > 0) {
            element.innerHTML = '';

            const timeExtent = {
                start: startDate,
                end: endDate,
                forceFullDay: true
            };

            createSingleMetricChart(element, validData, selectedMetric, reports, timeExtent);
        } else {
            console.warn('No valid data points after processing');
            element.innerHTML = '<p class="text-center">No valid data available for the selected date.</p>';
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        element.innerHTML = '<p class="text-center">Error loading data.</p>';
    }
}

// Create single metric chart with thresholds
function createSingleMetricChart(element, data, metric, reports, timeExtent) {
    const thresholds = {
        max_aqi: { safe: 50, moderate: 100, unhealthy: 150 },
        pm2_5: { safe: 12, moderate: 35.4, unhealthy: 55.4 },
        pm10: { safe: 54, moderate: 154, unhealthy: 254 },
        TVOC: { safe: 500, moderate: 1000, unhealthy: 2000 },
        eCO2: { safe: 1000, moderate: 2000, unhealthy: 5000 },
        pm1_0: { safe: 10, moderate: 20, unhealthy: 30 }
    }[metric] || { safe: 50, moderate: 100, unhealthy: 150 };

    createD3Chart({
        containerId: `#${element.id}`,
        dataFilePath: data,
        xAxisLabel: "Time",
        yAxisLabel: `${metric} Level`,
        lineColor: "#4CAF50",
        safeThreshold: thresholds.safe,
        moderateThreshold: thresholds.moderate,
        unhealthyThreshold: thresholds.unhealthy,
        width: element.clientWidth,
        height: element.clientHeight - 20,
        reports,
        timeExtent
    });
}

export { createD3Chart, fetchDataAndUpdateChart, createSingleMetricChart };