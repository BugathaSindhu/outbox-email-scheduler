import React, { useState } from 'react';
import api from '../services/api';

interface SearchBarProps {
  onSearchResults: (results: any[], source: string) => void;
  onClientFilterChange?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchResults, onClientFilterChange }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (val: string) => {
    setQuery(val);
    if (onClientFilterChange) {
      onClientFilterChange(val);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/emails/search?q=${encodeURIComponent(query.trim())}`);
      onSearchResults(res.data.results || [], res.data.source || 'elasticsearch');
    } catch (err) {
      console.error('Search error', err);
      onSearchResults([], 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-lg pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by recipient or subject..."
        className="w-full h-9 pl-9 pr-20 rounded-lg border border-slate-200 bg-white text-[#0f172a] text-xs font-normal placeholder:text-slate-400 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="absolute right-1 top-1 px-2.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded text-[11px] font-medium transition flex items-center disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};
