'use client';

import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCategoryFilter?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search medicines, brands, medical products...',
  onSearch,
  className,
  size = 'lg',
  showCategoryFilter = true,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const handleClear = () => {
    setQuery('');
    if (onSearch) onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(query);
    }
  };

  const sizes = {
    sm: 'h-10 text-xs px-3',
    md: 'h-12 text-sm px-4',
    lg: 'h-14 text-base px-5',
  };

  return (
    <div className={cn('relative w-full flex items-center bg-white border border-slate-200/90 rounded-2xl shadow-soft-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 transition-all', sizes[size], className)}>
      <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (onSearch) onSearch(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      {query && (
        <button
          onClick={handleClear}
          className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {showCategoryFilter && (
        <div className="shrink-0 border-l border-slate-200 pl-3 hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer hover:text-brand-600">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent border-none focus:outline-none cursor-pointer pr-2 font-medium text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="Medicines">Medicines</option>
            <option value="First Aid">First Aid</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Baby Care">Baby Care</option>
            <option value="Medical Devices">Medical Devices</option>
            <option value="Wellness">Wellness</option>
          </select>
        </div>
      )}
    </div>
  );
};
