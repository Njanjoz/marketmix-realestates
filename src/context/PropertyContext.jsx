// src/context/PropertyContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, 
  doc, serverTimestamp, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

const PropertyContext = createContext();

export const useProperties = () => useContext(PropertyContext);

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all', priceRange: [0, 100000000], bedrooms: 'any', 
    bathrooms: 'any', status: 'all', location: '', amenities: []
  });

  // FETCH: Load properties from Firestore
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const propsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propsData);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // CREATE: Admin adds a property
  const addProperty = async (propertyData) => {
    try {
      const docRef = await addDoc(collection(db, "properties"), {
        ...propertyData,
        createdAt: serverTimestamp(),
      });
      await fetchProperties(); // Refresh global list
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // UPDATE: Admin edits a property
  const updateProperty = async (id, updatedData) => {
    try {
      const propertyRef = doc(db, "properties", id);
      await updateDoc(propertyRef, { ...updatedData, updatedAt: serverTimestamp() });
      await fetchProperties();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // DELETE: Admin removes a property
  const deleteProperty = async (id) => {
    try {
      await deleteDoc(doc(db, "properties", id));
      setProperties(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    properties,
    loading,
    filters,
    setFilters,
    addProperty,
    updateProperty,
    deleteProperty,
    refreshProperties: fetchProperties
  };

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
};