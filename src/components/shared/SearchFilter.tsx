// src/components/shared/SearchFilter.tsx
// Issue #11: Add search/filter functionality
import React, { useState, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchFilterProps<T> {
  data: T[];
  searchKeys: (keyof T)[];
  onFilteredDataChange: (filtered: T[]) => void;
  placeholder?: string;
  filters?: {
    label: string;
    key: keyof T;
    options: { label: string; value: any }[];
  }[];
}

export function SearchFilter<T extends Record<string, any>>({
  data,
  searchKeys,
  onFilteredDataChange,
  placeholder = 'Search...',
  filters = [],
}: SearchFilterProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm) {
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter((item) => item[key] === value);
      }
    });

    return result;
  }, [data, searchTerm, activeFilters, searchKeys]);

  React.useEffect(() => {
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
  };

  const hasActiveFilters = searchTerm || Object.values(activeFilters).some((v) => v);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(activeFilters).filter((v) => v).length > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(activeFilters).filter((v) => v).length}
              </span>
            )}
          </button>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <div key={String(filter.key)}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[String(filter.key)] || ''}
                  onChange={(e) => handleFilterChange(String(filter.key), e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={String(option.value)} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Showing {filteredData.length} of {data.length} items
      </div>
    </div>
  );
}
