const riskLevels = {
    'Good': {
        description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        action: 'No action needed.'
    },
    'Moderate': {
        description: 'Air quality is acceptable; however, there may be a moderate health concern for a very small number of people.',
        action: 'Consider reducing prolonged exposure if you are sensitive to air pollution.'
    },
    'Unhealthy for Sensitive Groups': {
        description: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.',
        action: 'Sensitive groups should reduce prolonged or heavy exertion.'
    },
    'Unhealthy': {
        description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
        action: 'Everyone should reduce prolonged exposure.'
    },
    'Very Unhealthy': {
        description: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
        action: 'Avoid prolonged exposure. Consider temporary relocation.'
    },
    'Hazardous': {
        description: 'Health alert: everyone may experience more serious health effects.',
        action: 'Everyone should avoid all exposure to outdoor air.'
    }
};

function updateRiskText(riskLevel) {
    const riskDescription = document.getElementById('riskDescription');
    const riskAction = document.getElementById('riskAction');

    if (!riskDescription || !riskAction) {
        console.error('Risk description or action elements not found');
        return;
    }

    const riskInfo = riskLevels[riskLevel] || riskLevels['Moderate']; // Default to Moderate if level not found

    riskDescription.textContent = riskInfo.description;
    riskAction.textContent = riskInfo.action;
}

// Add this: Set initial state when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the current risk level from the display
    const currentRiskLevel = document.querySelector('.risk-level')?.textContent || 'Moderate';
    updateRiskText(currentRiskLevel);
});

// Export the function to be used by other modules
export { updateRiskText }; 