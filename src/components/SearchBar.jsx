import { useEffect, useRef } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';

export default function SearchBar({ searchTerm, onSearchChange, onRefresh, isRefreshing }) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchTerm) {
      timeoutRef.current = setTimeout(() => {
        onSearchChange('');
      }, 120000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, onSearchChange]);

  return (
    <div className="sticky top-0 z-20 bg-nhs-blue shadow-lg px-4 py-5">
      <div className="relative max-w-5xl mx-auto flex items-center gap-3">
        <div className="flex-1 flex items-center bg-nhs-white border-2 border-nhs-white rounded-lg focus-within:ring-4 focus-within:ring-nhs-yellow">
          <Search className="ml-5 text-nhs-grey" size={32} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for a drug..."
            className="flex-1 px-5 py-4 text-nhs-heading-s ipad:text-nhs-heading-m text-nhs-black bg-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="mr-3 p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="text-nhs-grey" size={32} />
            </button>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={`text-white ${isRefreshing ? 'animate-spin' : ''}`}
              size={28}
            />
          </button>
        )}
      </div>
    </div>
  );
}
