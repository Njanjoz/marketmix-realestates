// src/context/PropertyContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Import necessary Firestore functions
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase"; // Assuming db is exported from firebase.js

const PropertyContext = createContext();

export const useProperties = () => {
  return useContext(PropertyContext);
};

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: [0, 100000000], // Increased max price for realism
    bedrooms: 'any',
    bathrooms: 'any',
    status: 'all',
    location: '',
    amenities: []
  });

  // Mock data for initial development/empty database
  const getMockProperties = () => ([
    {
      id: 'prop1',
      title: "Modern 3-Bedroom Apartment",
      description: "A spacious and luxurious apartment in the heart of the city with modern amenities.",
      price: 150000,
      type: "apartment",
      status: "for-rent",
      location: "Kilimani, Nairobi",
      bedrooms: 3,
      bathrooms: 3,
      area: 1800,
      agentName: "Sarah Johnson",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
        "https://images.unsplash.com/photo-1570129477490-4e3188844b20"
      ],
      amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking", "Balcony"],
      featured: true,
      createdAt: new Date('2024-05-10').toISOString()
    },
    {
      id: 'prop2',
      title: "Luxury 5-Bedroom Villa",
      description: "Executive standalone villa set on a half-acre with mature garden.",
      price: 45000000,
      type: "house",
      status: "for-sale",
      location: "Karen, Nairobi",
      bedrooms: 5,
      bathrooms: 4,
      area: 4500,
      agentName: "Michael Chen",
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227",
      images: [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0"
      ],
      amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Garage", "Pet Friendly"],
      featured: true,
      createdAt: new Date('2024-01-05').toISOString()
    },
    {
        id: 'prop3',
        title: "Commercial Office Space",
        description: "Grade A office space in a prime location with excellent transport links.",
        price: 350000,
        type: "commercial",
        status: "for-rent",
        location: "CBD, Nairobi",
        bedrooms: 0,
        bathrooms: 2,
        area: 3000,
        agentName: "Sarah Johnson",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
        images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"],
        amenities: ["24/7 Security", "Parking", "Backup Generator", "High-speed Internet"],
        featured: false,
        createdAt: new Date('2024-04-20').toISOString()
      },
  ]);

  // Fetch properties from Firebase (or use mock data)
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const propertiesRef = collection(db, 'properties');
      
      // Attempt to fetch from Firestore first
      const snapshot = await getDocs(propertiesRef);
      
      if (snapshot.empty) {
        console.log("No properties found in Firestore. Using mock data.");
        const mockProperties = getMockProperties();
        setProperties(mockProperties);
        setFilteredProperties(mockProperties);
      } else {
        const propertiesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure price is a number for filtering/sorting
          price: Number(doc.data().price) 
        }));
        setProperties(propertiesList);
        setFilteredProperties(propertiesList);
      }
    } catch (error) {
      console.error("Error fetching properties from Firebase. Using mock data.", error);
      const mockProperties = getMockProperties();
      setProperties(mockProperties);
      setFilteredProperties(mockProperties);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);


  // --- Filter Logic ---

  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Ensure price ranges are numbers
      priceRange: [Number(newFilters.minPrice || newFilters.priceRange?.[0] || 0), Number(newFilters.maxPrice || newFilters.priceRange?.[1] || 100000000)],
      bedrooms: newFilters.bedrooms || 'any',
      bathrooms: newFilters.bathrooms || 'any',
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    let filtered = properties;
    const { type, priceRange, bedrooms, bathrooms, status, location, amenities } = filters;
    const [minPrice, maxPrice] = priceRange;

    filtered = filtered.filter(property => {
      // 1. Property Type
      if (type !== 'all' && property.type !== type) return false;

      // 2. Status
      if (status !== 'all' && property.status !== status) return false;
      
      // 3. Location (Case-insensitive partial match)
      if (location && !property.location.toLowerCase().includes(location.toLowerCase())) return false;

      // 4. Price Range
      if (property.price < minPrice || property.price > maxPrice) return false;

      // 5. Bedrooms
      if (bedrooms !== 'any' && property.bedrooms < Number(bedrooms)) return false;

      // 6. Bathrooms
      if (bathrooms !== 'any' && property.bathrooms < Number(bathrooms)) return false;
      
      // 7. Amenities (Match ALL selected amenities)
      if (amenities && amenities.length > 0) {
        const propertyAmenities = property.amenities || [];
        const matchesAll = amenities.every(amenity => propertyAmenities.includes(amenity));
        if (!matchesAll) return false;
      }

      return true;
    });

    // Timeout for visual effect, simulating a more complex filter process
    const timeout = setTimeout(() => {
        setFilteredProperties(filtered);
        setLoading(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timeout); // Cleanup
  }, [filters, properties]);

  // --- Utility Functions ---

  const getPropertyById = useCallback((id) => {
    return properties.find(p => p.id === id);
  }, [properties]);
  
  const getFeaturedProperties = useCallback(() => {
    return properties.filter(p => p.featured).slice(0, 4); // Get up to 4 featured
  }, [properties]);

  const value = {
    properties,
    filteredProperties,
    loading,
    filters,
    applyFilters,
    getPropertyById,
    getFeaturedProperties,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};