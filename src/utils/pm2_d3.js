import { getAirQualityDataByTimeRange } from '../firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const chartElement = document.getElementById('air_quality_monitor');
  const dateSelector = document.getElementById('dateSelector');
  const submitButton = document.createElement('button');

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
  if (dateSelector) {
    dateSelector.parentNode.insertBefore(submitButton, dateSelector.nextSibling);
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

  // Initial fetch with the current date
  const [year, month, day] = dateSelector.value.split('-').map(Number);
  const initialDate = new Date(year, month - 1, day, 12, 0, 0);
  if (!isNaN(initialDate)) {
    fetchDataAndUpdateChart(chartElement, initialDate);
  }
});

function fetchDataAndUpdateChart(element, selectedDate) {
  if (!element) {
    console.error('No valid chart element available');
    return;
  }

  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(selectedDate);
  endDate.setHours(23, 59, 59, 999);

  const options = {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  console.log('Start Date:', startDate.toLocaleString('en-US', options));
  console.log('End Date:', endDate.toLocaleString('en-US', options));

  getAirQualityDataByTimeRange(startDate, endDate)
    .then(data => {
      console.log('Fetched Data:', data);
      const pm2_5Data = data.filter(dataPoint => isValidPM2_5DataPoint(dataPoint));

      if (pm2_5Data.length > 0) {
        createSingleMetricChart(element, pm2_5Data, 'pm2_5');
      } else {
        console.warn('No valid pm2_5 data available for the selected date');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

function isValidPM2_5DataPoint(dataPoint) {
  return dataPoint.timestamp &&
    typeof dataPoint.pm2_5 === 'number' &&
    !isNaN(dataPoint.pm2_5);
}

function createSingleMetricChart(element, data, metric) {
  createD3Chart({
    containerId: `#${element.id}`,
    dataFilePath: data,
    xAxisLabel: "Time",
    yAxisLabel: `${metric.toUpperCase()} Level`,
    lineColor: "#4CAF50",
    safeThreshold: 12,
    moderateThreshold: 35.4,
    unhealthyThreshold: 55.4
  });
}