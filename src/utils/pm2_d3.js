import { getAirQualityDataByTimeRange, getReportsByTimeRange } from '../firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const chartElement = document.getElementById('air_quality_monitor');
  const dateSelector = document.getElementById('dateSelector');
  const submitButton = document.createElement('button');

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

  // Add options
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

  // Set default to maxAQI
  metricSelector.value = 'max_aqi';

  // Create and add submit button
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

  // Insert metric selector and submit button after date selector
  if (dateSelector) {
    const container = dateSelector.parentNode;
    container.insertBefore(metricSelector, dateSelector.nextSibling);
    container.insertBefore(submitButton, metricSelector.nextSibling);
  }

  // Set default date to today in EST
  const today = new Date();
  const estOptions = { timeZone: 'America/New_York' };
  const nyDate = new Date(today.toLocaleString('en-US', estOptions));
  const formattedDate = nyDate.toISOString().split('T')[0];

  // Force the date to be the current EST date
  const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  estDate.setHours(0, 0, 0, 0);
  const estFormattedDate = estDate.toISOString().split('T')[0];

  if (dateSelector) {
    dateSelector.value = estFormattedDate;
  }

  if (!chartElement || !dateSelector) {
    console.error('Chart element or date selector not found');
    return;
  }

  // Function to handle date selection and chart update
  const handleDateSelection = () => {
    const [year, month, day] = dateSelector.value.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0);

    if (isNaN(selectedDate)) {
      console.error('Invalid date selected');
      return;
    }
    fetchDataAndUpdateChart(chartElement, selectedDate);
  };

  // Handle submit button click
  submitButton.addEventListener('click', handleDateSelection);

  // Allow submission with Enter key
  dateSelector.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleDateSelection();
    }
  });

  // Add change event listener for metric selector
  metricSelector.addEventListener('change', handleDateSelection);

  // Initial fetch with EST date
  fetchDataAndUpdateChart(chartElement, estDate);
});

function fetchDataAndUpdateChart(element, selectedDate) {
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

  console.log('Querying with dates:', {
    start: startStr,
    end: endStr,
    metric: selectedMetric
  });

  // Fetch both air quality data and reports
  Promise.all([
    getAirQualityDataByTimeRange(startStr, endStr),
    getReportsByTimeRange(startStr, endStr)
  ])
    .then(([airData, reports]) => {
      console.log('Air Quality Data:', airData);
      console.log('Reports:', reports);

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
        // Force the domain to span full 24 hours by adding these properties
        const timeExtent = {
          start: startDate,
          end: endDate,
          forceFullDay: true  // New flag to indicate we want full day range
        };

        createSingleMetricChart(element, validData, selectedMetric, reports, timeExtent);
      } else {
        console.warn('No valid data available');
        element.innerHTML = '<p class="text-center">No valid data available for the selected date.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

function createSingleMetricChart(element, data, metric, reports, timeExtent) {
  let thresholds;
  switch (metric) {
    case 'max_aqi':
      thresholds = { safe: 50, moderate: 100, unhealthy: 150 };
      break;
    case 'pm2_5':
      thresholds = { safe: 12, moderate: 35.4, unhealthy: 55.4 };
      break;
    case 'pm10':
      thresholds = { safe: 54, moderate: 154, unhealthy: 254 };
      break;
    case 'TVOC':
      thresholds = { safe: 500, moderate: 1000, unhealthy: 2000 };
      break;
    case 'eCO2':
      thresholds = { safe: 1000, moderate: 2000, unhealthy: 5000 };
      break;
    case 'pm1_0':
      thresholds = { safe: 10, moderate: 20, unhealthy: 30 };
      break;
    default:
      thresholds = { safe: 50, moderate: 100, unhealthy: 150 };
  }

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
    reports: reports,
    timeExtent: timeExtent  // Pass the time extent to the D3 chart
  });
}

function updateReportsList(date) {
  // Assuming you have a Firebase collection of reports
  const reportsRef = firebase.firestore().collection('reports');

  // Query reports for the selected date
  reportsRef.where('date', '==', date)
    .orderBy('timestamp', 'desc')
    .get()
    .then((querySnapshot) => {
      const reportsList = document.getElementById('reports-list');
      reportsList.innerHTML = ''; // Clear existing reports

      querySnapshot.forEach((doc) => {
        const report = doc.data();
        const time = new Date(report.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        reportsList.innerHTML += `
                    <div class="report-item">
                        ${time} - ${report.title}
                    </div>
                `;
      });

      // Show message if no reports
      if (querySnapshot.empty) {
        reportsList.innerHTML = '<div class="no-reports">No reports for this date</div>';
      }
    });
}

// Add event listener to date selector
document.getElementById('dateSelector').addEventListener('change', (e) => {
  updateReportsList(e.target.value);
});

// Initialize with current date
updateReportsList(document.getElementById('dateSelector').value);