import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    addDoc,
    serverTimestamp
} from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: "aqm-nyu.firebasestorage.app",
    messagingSenderId: "117952405044",
    appId: "1:117952405044:web:5f24960256b42b9994b461",
    measurementId: "G-CCHS58CZQ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };

// Function to fetch the latest air quality data
export async function getLatestAirQualityData(numberOfRecords = 10) {
    try {
        const airQualityRef = collection(db, 'air_quality');
        const q = query(
            airQualityRef,
            orderBy('timestamp', 'desc'),
            limit(numberOfRecords)
        );

        const querySnapshot = await getDocs(q);
        const data = [];

        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return data;
    } catch (error) {
        console.error("Error fetching air quality data:", error);
        throw error;
    }
}

// Function to fetch data within a specific time range
export async function getAirQualityDataByTimeRange(startDate, endDate) {
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    if (!startDate || !endDate) {
        console.error('Invalid date range:', startDate, endDate);
        return Promise.reject(new Error('Invalid date range'));
    }

    try {
        const airQualityRef = collection(db, 'air_quality');
        const q = query(
            airQualityRef,
            orderBy('timestamp'),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate)
        );

        const querySnapshot = await getDocs(q);
        const data = [];

        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return data;
    } catch (error) {
        console.error("Error fetching air quality data:", error);
        throw error;
    }
}

// Add this new function
export async function getReportsByTimeRange(startDate, endDate) {
    const reportsRef = collection(db, 'airQualityReports');
    const q = query(
        reportsRef,
        where('date', '>=', new Date(startDate)),
        where('date', '<=', new Date(endDate))
    );

    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure date is properly converted to Date object
            date: doc.data().date.toDate() // Convert Firestore Timestamp to Date
        }));
    } catch (error) {
        console.error('Error fetching reports:', error);
        return [];
    }
}

// Example usage:
// getLatestAirQualityData().then(data => console.log(data));