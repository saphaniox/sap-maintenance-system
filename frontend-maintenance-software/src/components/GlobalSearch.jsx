import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api.service';
import '../styles/components/GlobalSearch.css';

function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    machines: [],
    maintenance: [],
    inventory: [],
    requisitions: [],
    sites: [],
    productionReports: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Grab recent searches from browser storage when component loads
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (err) {
        // If the saved data is corrupted, just start fresh
        console.log('Could not load recent searches:', err);
      }
    }
  }, []);

  useEffect(() => {
    // Close the dropdown when user clicks anywhere else on the page
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Don't search if they typed less than 2 characters
    if (searchQuery.trim().length < 2) {
      setSearchResults({
        machines: [],
        maintenance: [],
        inventory: [],
        requisitions: [],
        sites: [],
        productionReports: []
      });
      return;
    }

    // Wait 300ms after they stop typing before searching
    // This prevents hammering the API while they're still typing
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    setShowResults(true);

    try {
      // Search all modules at once for better performance
      // If any fail, just return empty array for that module
      const [machines, maintenance, inventory, requisitions, sites, productionReports] = await Promise.all([
        apiService.get(`/api/machines?search=${query}`).catch(() => ({ data: [] })),
        apiService.get(`/api/maintenance?search=${query}`).catch(() => ({ data: [] })),
        apiService.get(`/api/inventory?search=${query}`).catch(() => ({ data: [] })),
        apiService.get(`/api/requisitions?search=${query}`).catch(() => ({ data: [] })),
        apiService.get(`/api/sites?search=${query}`).catch(() => ({ data: [] })),
        apiService.get(`/api/production-reports?search=${query}`).catch(() => ({ data: [] }))
      ]);

      // Only show first 5 results per category to keep dropdown manageable
      setSearchResults({
        machines: machines.data.slice(0, 5),
        maintenance: maintenance.data.slice(0, 5),
        inventory: inventory.data.slice(0, 5),
        requisitions: requisitions.data.slice(0, 5),
        sites: sites.data.slice(0, 5),
        productionReports: productionReports.data.slice(0, 5)
      });

      // Remember this search for quick access later
      saveRecentSearch(query);
    } catch (error) {
      // Oops, something went wrong - just show what we have
      console.error('❌ Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const saveRecentSearch = (query) => {
    // Keep the 5 most recent searches, avoiding duplicates
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleResultClick = (type, id) => {
    // Close search and navigate to the relevant page
    setShowResults(false);
    setSearchQuery('');
    
    const routes = {
      machines: '/machines',
      maintenance: '/maintenance',
      inventory: '/inventory',
      requisitions: '/requisitions',
      sites: '/sites',
      productionReports: '/production-reports'
    };

    navigate(routes[type]);
  };

  const handleRecentSearchClick = (query) => {
    // Re-run a previous search
    setSearchQuery(query);
  };

  const clearRecentSearches = () => {
    // Wipe the history clean
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getTotalResults = () => {
    // Count up results from all categories
    return Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getResultIcon = (type) => {
    // Show a friendly emoji icon for each category
    const icons = {
      machines: '🔧',
      maintenance: '⚙️',
      inventory: '📦',
      requisitions: '📋',
      sites: '🏭',
      productionReports: '📊'
    };
    return icons[type] || '📄';
  };

  const getResultTitle = (type, item) => {
    // Pick the best title text based on what type of result it is
    const titles = {
      machines: item.name || item.model,
      maintenance: item.title || `Maintenance #${item._id?.slice(-6)}`,
      inventory: item.name,
      requisitions: item.itemName || `Requisition #${item._id?.slice(-6)}`,
      sites: item.name,
      productionReports: `Report - ${new Date(item.date).toLocaleDateString()}`
    };
    return titles[type];
  };

  const getResultSubtitle = (type, item) => {
    // Show helpful extra context for each result
    const subtitles = {
      machines: item.site?.name || item.type,
      maintenance: item.machine?.name || item.status,
      inventory: `Quantity: ${item.quantity}`,
      requisitions: item.status,
      sites: item.location,
      productionReports: item.site?.name
    };
    return subtitles[type];
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search machines, maintenance, inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
        {/* Show loading spinner while searching */}
        {isSearching && <span className="search-loader">⏳</span>}
      </div>

      {showResults && (
        <div className="search-results">
          {searchQuery.trim().length < 2 ? (
            <div className="search-hint">
              {recentSearches.length > 0 ? (
                <>
                  <div className="recent-searches-header">
                    <span className="recent-title">Recent Searches</span>
                    <button className="clear-recent" onClick={clearRecentSearches}>
                      Clear
                    </button>
                  </div>
                  <div className="recent-searches">
                    {recentSearches.map((query, index) => (
                      <button
                        key={index}
                        className="recent-search-item"
                        onClick={() => handleRecentSearchClick(query)}
                      >
                        <span className="recent-icon">🕐</span>
                        {query}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p>Type at least 2 characters to search...</p>
              )}
            </div>
          ) : getTotalResults() === 0 && !isSearching ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No results found for "{searchQuery}"</p>
              <span className="no-results-hint">Try different keywords</span>
            </div>
          ) : (
            <>
              <div className="results-header">
                Found {getTotalResults()} result{getTotalResults() !== 1 ? 's' : ''}
              </div>
              {Object.entries(searchResults).map(([type, items]) => 
                items.length > 0 && (
                  <div key={type} className="results-section">
                    <div className="results-section-title">
                      {getResultIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                    </div>
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="result-item"
                        onClick={() => handleResultClick(type, item._id)}
                      >
                        <div className="result-content">
                          <div className="result-title">{getResultTitle(type, item)}</div>
                          <div className="result-subtitle">{getResultSubtitle(type, item)}</div>
                        </div>
                        <span className="result-arrow">→</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
