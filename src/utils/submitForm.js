import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('airQualityForm');
    const submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable submit button while processing
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            // Get form values
            const formData = {
                title: form.title.value,
                description: form.description.value,
                date: new Date(
                    2024,
                    getMonthNumber(form.month.value),
                    parseInt(form.day.value),
                    convertTo24Hour(form.hour.value, form.period.value),
                    parseInt(form.minute.value)
                ),
                fullName: form.fullName.value,
                email: form.email.value,
                submittedAt: serverTimestamp()
            };

            // Validate form
            if (!validateForm(formData)) {
                throw new Error('Please fill in all required fields');
            }

            // Submit to Firebase
            await addDoc(collection(db, 'airQualityReports'), formData);

            // Show success message
            alert('Report submitted successfully!');

            // Reset form
            form.reset();

        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form. Please try again.');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Report';
        }
    });
});

// Helper functions
function validateForm(data) {
    return data.title &&
        data.title.length <= 100 &&
        data.description &&
        data.fullName &&
        data.email &&
        isValidEmail(data.email);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getMonthNumber(monthStr) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return months[monthStr];
}

function convertTo24Hour(hour, period) {
    hour = parseInt(hour);
    if (period === 'pm' && hour !== 12) {
        hour += 12;
    } else if (period === 'am' && hour === 12) {
        hour = 0;
    }
    return hour;
} 