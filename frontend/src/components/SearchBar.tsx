import React, { useState } from 'react';
import api from '../services/api';

interface SearchBarProps {
  onSearchResults: (results: any[], source: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

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
      <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#737686] text-lg pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by recipient or subject (Elasticsearch)..."
        className="w-full h-9 pl-9 pr-20 rounded-lg border border-[#c3c6d7] bg-white text-[#0b1c30] text-[13px] placeholder:text-[#737686] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="absolute right-1 top-1 px-2.5 py-1 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded text-[11px] font-semibold transition flex items-center disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};
