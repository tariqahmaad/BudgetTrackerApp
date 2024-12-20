import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };