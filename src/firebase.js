import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,  // Add this import
    getDocs,
    query,
    orderBy,
    limit
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

// Example usage:
// getLatestAirQualityData().then(data => console.log(data));