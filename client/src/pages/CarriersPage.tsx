import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCarriers } from '@/lib/api';
import { Carrier } from '@shared/schema';
import CarrierFilter from '@/components/CarrierFilter';
import CarrierSearchBar from '@/components/CarrierSearchBar';
import { Building2, Mail, Phone, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CarriersPage() {
  const [selectedCoverTypes, setSelectedCoverTypes] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  
  const { data: carriers = [], isLoading, error } = useQuery({
    queryKey: ['carriers'],
    queryFn: fetchCarriers
  });

  const handleFilterChange = (selectedTypes: string[]) => {
    setSelectedCoverTypes(selectedTypes);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  // Filter carriers based on selected cover types and search text
  const filteredCarriers = useMemo(() => {
    return carriers.filter((carrier) => {
      // Filter by search text
      const matchesSearch = searchText === '' || 
        carrier.name.toLowerCase().includes(searchText.toLowerCase());
      
      // Filter by cover types if any are selected
      const matchesFilters = selectedCoverTypes.length === 0 || 
        selectedCoverTypes.some(coverType => 
          carrier.specialties?.includes(coverType)
        );
      
      return matchesSearch && matchesFilters;
    });
  }, [carriers, selectedCoverTypes, searchText]);

  return (
    <div className="px-4 py-4 w-full max-w-full">
      {/* Top row with search bar and filter on the same line */}
      <div className="flex justify-between items-center mb-6">
        {/* Custom styled search container with reduced width */}
        <div className="w-1/2 relative">
          <CarrierSearchBar onSearch={handleSearch} />
        </div>
        
        {/* Carrier Filter */}
        <div className="ml-4">
          <CarrierFilter onFilterChange={handleFilterChange} />
        </div>
      </div>
      
      {/* Results area */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="spinner border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading carriers: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : filteredCarriers.length > 0 ? (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                {filteredCarriers.length} {filteredCarriers.length === 1 ? 'carrier' : 'carriers'} found
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCarriers.map((carrier) => (
                <Card key={carrier.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5 text-blue-500" />
                      {carrier.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      {carrier.email && (
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-gray-500" />
                          <a href={`mailto:${carrier.email}`} className="text-blue-600 hover:underline">
                            {carrier.email}
                          </a>
                        </div>
                      )}
                      
                      {carrier.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-gray-500" />
                          <span>{carrier.phone}</span>
                        </div>
                      )}
                      
                      {carrier.website && (
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4 text-gray-500" />
                          <a href={carrier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {carrier.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {carrier.specialties && carrier.specialties.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1">
                          {carrier.specialties.map((specialty, index) => (
                            <Badge 
                              key={index} 
                              variant={selectedCoverTypes.includes(specialty) ? "default" : "outline"}
                              className={selectedCoverTypes.includes(specialty) ? "bg-blue-500" : ""}
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-2 flex justify-between">
                    <div className="text-sm text-gray-500">
                      {carrier.minPremium && carrier.maxPremium && (
                        <span>Premium: ${carrier.minPremium.toLocaleString()} - ${carrier.maxPremium.toLocaleString()}</span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <ShieldCheck className="mr-1 h-4 w-4" />
                      Match
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No matching carriers</h3>
              <p className="text-gray-500 max-w-md">
                {selectedCoverTypes.length > 0
                  ? `No carriers match the selected filter criteria: ${selectedCoverTypes.join(', ')}`
                  : searchText
                    ? `No carriers match the search term: "${searchText}"`
                    : "Please select filters or enter a search term to see matching carriers"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}