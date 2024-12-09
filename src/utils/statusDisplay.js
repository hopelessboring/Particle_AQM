function updateStatusDisplay() {
    const statusElement = document.getElementById('statusDisplay');
    const now = new Date();
    const options = {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    const dateStr = now.toLocaleDateString('en-US', options);

    // You can add logic here to check if the system is online
    // For now, we'll assume it's online if we can update the date
    if (statusElement) {
        statusElement.innerHTML = `Live data - ${dateStr}`;
        statusElement.style.color = '#F0F0F0'; // Green color for active status
    }
}

// Update immediately and then every minute
updateStatusDisplay();
setInterval(updateStatusDisplay, 60000); 