import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchClients } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Client } from '@shared/schema';

export default function ClientSearch() {
  const [searchText, setSearchText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [_, navigate] = useLocation();
  
  // Use react-query to fetch clients based on search text
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', 'search', searchText],
    queryFn: () => fetchClients(searchText),
    enabled: searchText.length > 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    if (e.target.value.length > 1) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleClear = () => {
    setSearchText('');
    setShowResults(false);
  };

  const handleSelect = (client: Client) => {
    navigate(`/clients/${client.id}`);
    setSearchText('');
    setShowResults(false);
  };

  return (
    <div className="py-4 px-6 border-b border-gray-200">
      <div className="text-xl font-bold mb-4">Client Search</div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        <input
          type="text"
          value={searchText}
          onChange={handleChange}
          placeholder="Search clients..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {searchText && (
          <button 
            type="button"
            aria-label="Clear search"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {showResults && searchText.length > 1 && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : clients.length > 0 ? (
            <ul className="max-h-60 overflow-auto">
              {clients.map((client) => (
                <li 
                  key={client.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelect(client)}
                >
                  <div className="font-medium">{client.name}</div>
                  {client.businessType && (
                    <div className="text-xs text-gray-500">{client.businessType}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No clients found</div>
          )}
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          variant="outline" 
          className="text-green-600 border-green-600 hover:bg-green-50"
          onClick={() => navigate('/clients/new')}
        >
          + Create New Client
        </Button>
      </div>
    </div>
  );
}