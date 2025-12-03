// src/context/SearchContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  return useContext(SearchContext);
};

export const SearchProvider = ({ children }) => {
  // Stores history of user searches
  const [searchHistory, setSearchHistory] = useState([]);
  
  // Stores recent or popular searches (pre-defined or fetched)
  const [recentSearches, setRecentSearches] = useState([
    { query: 'Nairobi Westlands', type: 'location', count: 45 },
    { query: 'Apartments for Rent', type: 'property', count: 120 },
    { query: '2 Bedroom Houses', type: 'property', count: 89 },
    { query: 'Mombasa Nyali', type: 'location', count: 67 },
    { query: 'Commercial Spaces', type: 'property', count: 34 }
  ]);

  // Stores the currently active set of search filters
  const [searchFilters, setSearchFilters] = useState({
    query: '', // The raw text input from the search bar
    location: '', // Specific location part of the query
    propertyType: 'all',
    minPrice: 0,
    maxPrice: 100000000,
    bedrooms: 'any',
    bathrooms: 'any',
    status: 'all',
    amenities: [],
    sortBy: 'recent',
    view: 'grid'
  });

  // Adds a search action to the history and updates recent searches count
  const addToSearchHistory = useCallback((searchData) => {
    const newSearch = {
      ...searchData,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    // Update search history (latest 10 entries)
    setSearchHistory(prev => {
      // Remove duplicates from history, only keep the latest
      const filtered = prev.filter(item => item.query !== newSearch.query);
      return [newSearch, ...filtered].slice(0, 10);
    });

    // Update recent searches with frequency (for popular searches list)
    setRecentSearches(prev => {
      const existing = prev.find(item => item.query === searchData.query);
      if (existing) {
        // Increment count for existing search
        return prev.map(item => 
          item.query === searchData.query 
            ? { ...item, count: item.count + 1 }
            : item
        ).sort((a, b) => b.count - a.count); // Re-sort by count
      } else if (searchData.query) {
        // Add new search if query is not empty
        return [{ query: searchData.query, type: searchData.type || 'search', count: 1 }, ...prev].slice(0, 5);
      }
      return prev;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Updates the search filters state
  const updateSearchFilters = useCallback((newFilters) => {
    setSearchFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Resets all search filters to their default state
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
      amenities: [],
      sortBy: 'recent',
      view: 'grid'
    });
  }, []);

  const value = {
    searchHistory,
    recentSearches,
    searchFilters,
    addToSearchHistory,
    clearSearchHistory,
    updateSearchFilters,
    resetSearchFilters
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};