import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCoverTypes } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CarrierFilterProps {
  onFilterChange: (selectedTypes: string[]) => void;
}

export default function CarrierFilter({ onFilterChange }: CarrierFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoverTypes, setSelectedCoverTypes] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fetch cover types from API
  const { data: coverTypes = [], isLoading, error } = useQuery({
    queryKey: ['coverTypes'],
    queryFn: fetchCoverTypes
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (coverType: string) => {
    setSelectedCoverTypes((prev) => {
      // If already selected, remove it
      if (prev.includes(coverType)) {
        const updated = prev.filter((type) => type !== coverType);
        onFilterChange(updated);
        return updated;
      } 
      // Otherwise, add it
      const updated = [...prev, coverType];
      onFilterChange(updated);
      return updated;
    });
  };

  const clearFilters = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCoverTypes([]);
    onFilterChange([]);
  };

  const selectedCount = selectedCoverTypes.length;

  return (
    <div className="relative w-fit" ref={dropdownRef}>
      <Button
        variant="outline"
        className="flex items-center justify-between px-4 py-2 h-10 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        onClick={handleToggle}
      >
        <div className="flex items-center">
          <Filter className="mr-2 h-4 w-4 text-gray-500" />
          <span className="font-medium">
            {selectedCount > 0 
              ? `Covers: ${selectedCount}`
              : 'Select Covers'}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="ml-2 h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
        )}
      </Button>

      {selectedCount > 0 && (
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white"
        >
          {selectedCount}
        </Badge>
      )}

      {isOpen && (
        <div className="absolute mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg w-72 right-0">
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <h3 className="font-medium text-sm">Cover Types</h3>
            {selectedCount > 0 && (
              <button 
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="p-3">
            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="text-sm text-red-500 p-2">
                Error loading cover types. Please try again.
              </div>
            ) : coverTypes.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-2">
                No cover types available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {coverTypes.map((coverType: { id: number; name: string }) => (
                  <div key={coverType.id} className="flex items-center space-x-2 py-1">
                    <Checkbox 
                      id={`cover-${coverType.id}`} 
                      checked={selectedCoverTypes.includes(coverType.name)}
                      onCheckedChange={() => handleCheckboxChange(coverType.name)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor={`cover-${coverType.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {coverType.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}