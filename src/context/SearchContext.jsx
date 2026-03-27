// src/context/SearchContext.jsx - UPDATED WITH BETTER ERROR HANDLING
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const SearchContext = createContext(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    console.warn('useSearch must be used within SearchProvider - returning default values');
    // Return default values instead of throwing to prevent crash
    return {
      searchHistory: [],
      recentSearches: [],
      searchFilters: { status: 'all', type: 'all', location: '' },
      addToSearchHistory: () => {},
      clearSearchHistory: () => {},
      updateSearchFilters: () => {},
      resetSearchFilters: () => {}
    };
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([
    { query: 'Nairobi Westlands', type: 'location', count: 45 },
    { query: 'Apartments for Rent', type: 'property', count: 120 },
    { query: '2 Bedroom Houses', type: 'property', count: 89 },
    { query: 'Mombasa Nyali', type: 'location', count: 67 },
    { query: 'Commercial Spaces', type: 'property', count: 34 }
  ]);
  
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    location: '',
    propertyType: 'all',
    minPrice: 0,
    maxPrice: 100000000,
    bedrooms: 'any',
    bathrooms: 'any',
    status: 'all',
    type: 'all',
    amenities: [],
    sortBy: 'recent',
    view: 'grid'
  });

  const addToSearchHistory = useCallback((searchData) => {
    const newSearch = {
      ...searchData,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query !== newSearch.query);
      return [newSearch, ...filtered].slice(0, 10);
    });

    setRecentSearches(prev => {
      const existing = prev.find(item => item.query === searchData.query);
      if (existing) {
        return prev.map(item => 
          item.query === searchData.query 
            ? { ...item, count: item.count + 1 }
            : item
        ).sort((a, b) => b.count - a.count);
      } else if (searchData.query) {
        return [{ query: searchData.query, type: searchData.type || 'search', count: 1 }, ...prev].slice(0, 5);
      }
      return prev;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const updateSearchFilters = useCallback((newFilters) => {
    console.log('🔄 Updating search filters:', newFilters);
    setSearchFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const resetSearchFilters = useCallback(() => {
    setSearchFilters({
      query: '',
      location: '',
      propertyType: 'all',
      minPrice: 0,
      maxPrice: 100000000,
      bedrooms: 'any',
      bathrooms: 'any',
      status: 'all',
      type: 'all',
      amenities: [],
      sortBy: 'recent',
      view: 'grid'
    });
  }, []);

  const value = useMemo(() => ({
    searchHistory,
    recentSearches,
    searchFilters,
    addToSearchHistory,
    clearSearchHistory,
    updateSearchFilters,
    resetSearchFilters
  }), [searchHistory, recentSearches, searchFilters, addToSearchHistory, clearSearchHistory, updateSearchFilters, resetSearchFilters]);

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};