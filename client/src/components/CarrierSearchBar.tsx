import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CarrierSearchBarProps {
  onSearch?: (searchText: string) => void;
}

export default function CarrierSearchBar({ onSearch }: CarrierSearchBarProps) {
  const [searchText, setSearchText] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    
    // Call onSearch with empty string to reset search
    if (onSearch) {
      onSearch('');
    }
    
    // Re-focus input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Acme Manufacturing ltd."
        value={searchText}
        onChange={handleSearchChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClearSearch();
          }
        }}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {searchText && (
        <button 
          type="button"
          aria-label="Clear search"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={handleClearSearch}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}