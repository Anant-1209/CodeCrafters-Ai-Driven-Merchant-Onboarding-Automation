// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Uncomment this line
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD1iBlG_KfPaYSWarKcF4-aKIiQVX9jvNc",
  authDomain: "merchant-onboard-hackathon.firebaseapp.com",
  projectId: "merchant-onboard-hackathon",
  storageBucket: "gcf-v2-uploads-644168759457.us-central1.cloudfunctions.appspot.com",
  messagingSenderId: "644168759457",
  appId: "1:644168759457:web:d648130acf5d66d49758e0",
  measurementId: "G-FE8F21009Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, app, auth };