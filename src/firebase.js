// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Update the import path to use @firebase/auth
import { getReactNativePersistence } from '@firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBmCbIrIW7JnW3agVjvzcTT1VQUBRUIUv8",
    authDomain: "budgettrackerapp-b08bf.firebaseapp.com",
    projectId: "budgettrackerapp-b08bf",
    storageBucket: "budgettrackerapp-b08bf.firebasestorage.app",
    messagingSenderId: "898023041107",
    appId: "1:898023041107:web:c135985fbb016c6311bea6",
    measurementId: "G-MYXXBCV36R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
if (Platform.OS !== 'web') {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } catch (error) {
        console.warn('Auth persistence initialization failed:', error);
        auth = getAuth(app);
    }
} else {
    auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };