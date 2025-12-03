// scripts/initFirebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA0hXvFv8IOxLAjFm-3RGR7jcIoQueagKw",
  authDomain: "housing-database-e467b.firebaseapp.com",
  projectId: "housing-database-e467b",
  storageBucket: "housing-database-e467b.firebasestorage.app",
  messagingSenderId: "488900008428",
  appId: "1:488900008428:web:a4c97a2bf8ba35511108c9",
  measurementId: "G-MCKLY7P7TR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleProperties = [
  {
    title: "Modern 3-Bedroom Apartment in Kilimani",
    description: "Spacious apartment with panoramic city views, modern finishes, and premium amenities.",
    price: 85000,
    type: "apartment",
    status: "for-rent",
    location: "Kilimani, Nairobi",
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    yearBuilt: 2020,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227"
    ],
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking", "Garden"],
    features: ["Fully Furnished", "Modern Kitchen", "Ensuite Bathrooms", "Balcony"],
    agent: {
      name: "John Doe",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      phone: "+254 712 345 678",
      email: "john@marketmix.co.ke",
      rating: 4.9,
      propertiesListed: 45
    },
    createdAt: new Date(),
    views: 1245,
    savedCount: 89,
    featured: true,
    verified: true
  },
  {
    title: "Luxury Villa in Karen",
    description: "Exclusive 5-bedroom villa with private garden, pool, and staff quarters.",
    price: 45000000,
    type: "villa",
    status: "for-sale",
    location: "Karen, Nairobi",
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    yearBuilt: 2018,
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0"
    ],
    amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Garage", "Security"],
    features: ["Maid's Quarters", "Wine Cellar", "Home Theater", "Study"],
    agent: {
      name: "Sarah Johnson",
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786",
      phone: "+254 723 456 789",
      email: "sarah@marketmix.co.ke",
      rating: 4.8,
      propertiesListed: 32
    },
    createdAt: new Date('2023-11-15'),
    views: 892,
    savedCount: 45,
    featured: true,
    verified: true
  },
  {
    title: "2-Bedroom Apartment in Westlands",
    description: "Modern apartment with city views, perfect for young professionals.",
    price: 65000,
    type: "apartment",
    status: "for-rent",
    location: "Westlands, Nairobi",
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    yearBuilt: 2021,
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0"
    ],
    amenities: ["24/7 Security", "Parking", "Wifi", "Backup Generator"],
    features: ["Fully Furnished", "Balcony", "Storage"],
    agent: {
      name: "Michael Chen",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      phone: "+254 734 567 890",
      email: "michael@marketmix.co.ke",
      rating: 4.7,
      propertiesListed: 28
    },
    createdAt: new Date('2024-01-05'),
    views: 567,
    savedCount: 23,
    featured: false,
    verified: true
  }
];

const initFirebase = async () => {
  try {
    console.log("Initializing Firebase with sample data...");
    
    const propertiesRef = collection(db, 'properties');
    
    // Add sample properties
    for (const property of sampleProperties) {
      await addDoc(propertiesRef, property);
      console.log(`Added property: ${property.title}`);
    }
    
    console.log("Firebase initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
};

// Run the initialization
initFirebase();