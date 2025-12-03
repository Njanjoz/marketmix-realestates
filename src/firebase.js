// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0hXvFv8IOxLAjFm-3RGR7jcIoQueagKw",
  authDomain: "housing-database-e467b.firebaseapp.com",
  projectId: "housing-database-e467b",
  storageBucket: "housing-database-e467b.firebasestorage.app",
  messagingSenderId: "488900008428",
  appId: "1:488900008428:web:a4c97a2bf8ba35511108c9",
  measurementId: "G-MCKLY7P7TR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Analytics (optional)
const analytics = getAnalytics(app);

export { app, db, storage, auth, analytics };