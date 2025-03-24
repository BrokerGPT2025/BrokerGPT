import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientProfileSchema, type Client } from '@shared/schema';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { fetchClients } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function SearchBar() {
  const [searchText, setSearchText] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = (to: string) => setLocation(to);

  // Use react-query to fetch clients based on search text
  const { data: clientSuggestions = [], isLoading } = useQuery({
    queryKey: ['clients', 'search', searchText],
    queryFn: () => fetchClients(searchText),
    enabled: searchText.length > 1,
  });

  const form = useForm<z.infer<typeof clientProfileSchema>>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
      businessType: '',
      annualRevenue: undefined,
      employees: undefined,
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (value.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setShowSuggestions(false);
    
    // Re-focus input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleClientSelect = (client: Client) => {
    navigate(`/clients/${client.id}`);
    setSearchText('');
    setShowSuggestions(false);
  };

  const handleCreateProfile = async (data: z.infer<typeof clientProfileSchema>) => {
    try {
      const response = await apiRequest('POST', '/api/clients', data);
      const newClient = await response.json();
      
      toast({
        title: 'Profile Created',
        description: `Successfully created profile for ${newClient.name}`,
      });
      
      setDialogOpen(false);
      form.reset();
      navigate(`/clients/${newClient.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create client profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center">
      <div className="relative flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search clients..."
            value={searchText}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClearSearch();
              }
            }}
            onFocus={() => {
              if (searchText.length > 1) {
                setShowSuggestions(true);
              }
            }}
            onBlur={(e) => {
              // Only hide suggestions if the click wasn't on a suggestion
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (!relatedTarget?.closest('.suggestions-dropdown')) {
                setTimeout(() => setShowSuggestions(false), 200);
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
          
          {/* Suggestions dropdown */}
          {showSuggestions && searchText.length > 1 && (
            <div className="suggestions-dropdown absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
              ) : clientSuggestions.length > 0 ? (
                <ul className="max-h-60 overflow-auto">
                  {clientSuggestions.map((client) => (
                    <li 
                      key={client.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleClientSelect(client)}
                      tabIndex={0}
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
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="ml-3 text-green-600 hover:text-green-800 text-sm font-medium">
            + create profile
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Client Profile</DialogTitle>
            <DialogDescription>
              Enter client information to create a new profile
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateProfile)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Retail, Manufacturing, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Vancouver" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province/State</FormLabel>
                      <FormControl>
                        <Input placeholder="BC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Revenue</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Profile</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
