'use client';

import { useState } from 'react';
import { searchAPI } from '@/lib/api';
import { debounce } from '@/lib/utils';

export default function SearchBar({ onSearch, onSuggestions }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = debounce(async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchAPI.getSuggestions(searchTerm);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Suggestions error:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (title) => {
    setQuery(title);
    setSuggestions([]);
    onSearch(title);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search academic papers... (e.g., Machine Learning, COVID-19)"
            className="w-full px-6 py-4 rounded-full border-2 text-base"
            style={{ borderColor: '#003f87' }}
          />
          <button
            type="submit"
            className="absolute right-2 p-2 rounded-full text-white"
            style={{ backgroundColor: '#003f87' }}
          >
            🔍
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-10">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion.title)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-800">{suggestion.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {suggestion.authors?.join(', ')} • {suggestion.year}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}