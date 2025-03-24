import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { fetchClientsQueryFn } from '@/lib/api';
import { Client } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

/**
 * A simplified component that displays a dropdown of clients to select
 * This doesn't use any of the problematic search components
 */
export default function SimpleClientSelector() {
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch all clients
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: fetchClientsQueryFn
  });

  const selectClient = (clientId: number) => {
    navigate(`/clients/${clientId}`);
    setIsOpen(false);
  };

  if (isLoading) {
    return <div className="p-4">Loading clients...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading clients</div>;
  }

  return (
    <div className="p-4 relative">
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        variant="outline"
      >
        Select a Client
        <span className="ml-2">▼</span>
      </Button>
      
      {isOpen && (
        <Card className="absolute mt-1 w-full z-10">
          <CardContent className="p-2">
            <ul className="max-h-60 overflow-auto divide-y">
              {clients.map((client: Client) => (
                <li 
                  key={client.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectClient(client.id)}
                >
                  {client.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}