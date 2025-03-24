import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { fetchClientsQueryFn } from '@/lib/api';
import { Client } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, PlusCircle, User2, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import ClientSearch from '@/components/ClientSearch';

export default function ClientListPage() {
  const { 
    data: clients, 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: ['/api/clients'], 
    queryFn: fetchClientsQueryFn 
  });

  if (isLoading) {
    return (
      <div className="p-6 w-full max-w-full">
        <div className="mb-6">
          <div className="relative flex items-center max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <Input 
              type="text" 
              placeholder="Search clients..."
              className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 rounded">
                <PlusCircle className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-6"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-60 bg-gray-200 rounded-md"></div>
            <div className="h-60 bg-gray-200 rounded-md"></div>
            <div className="h-60 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full max-w-full">
        <div className="mb-6">
          <div className="relative flex items-center max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <Input 
              type="text" 
              placeholder="Search clients..."
              className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 rounded">
                <PlusCircle className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading clients: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 w-full max-w-full">
      <ClientSearch />
    
      {clients && clients.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="flex flex-col items-center justify-center">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No clients yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
              <Button asChild>
                <Link href="/clients/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Client
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients?.map((client: Client) => (
            <div key={client.id} className="h-full">
              <Link href={`/clients/${client.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{client.name}</CardTitle>
                      <Badge variant="outline">{client.businessType}</Badge>
                    </div>
                    <CardDescription>
                      {client.city}, {client.province}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <User2 className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{client.employees} employees</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="pt-4">
                    <div className="w-full text-sm text-gray-500">
                      Client since: {client.createdAt && format(new Date(client.createdAt), 'MMMM yyyy')}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}