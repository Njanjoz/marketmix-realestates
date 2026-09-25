// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };