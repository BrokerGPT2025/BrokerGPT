import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { 
  fetchClient, 
  fetchClientRecords, 
  fetchRecordTypes,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  updateClient,
  researchCompany
} from '@/lib/api';
import { Client, ClientRecord, RecordType } from '@shared/schema';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Trash2, PlusCircle, InfoIcon, Search } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { useToast } from "@/hooks/use-toast";

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id);
  
  const [client, setClient] = useState<Client | null>(null);
  const [clientRecords, setClientRecords] = useState<ClientRecord[]>([]);
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Editable client state to track form changes
  const [editableClient, setEditableClient] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // New record form state
  const [newRecord, setNewRecord] = useState<{
    type: string;
    description: string;
    value: string;
    date: Date;
  }>({
    type: '',
    description: '',
    value: '',
    date: new Date(),
  });
  
  // Editing state
  const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch client first to avoid potential missing data issues
        const clientData = await fetchClient(clientId);
        setClient(clientData);
        // Initialize editable client state with fetched client data
        setEditableClient(clientData);
        console.log("Client data loaded:", clientData);
        
        // Now fetch records and record types
        try {
          console.log(`Fetching records for client ID: ${clientId}`);
          const recordData = await fetchClientRecords(clientId);
          console.log(`Client records fetched: ${recordData.length} records found`, recordData);
          
          if (recordData && Array.isArray(recordData)) {
            console.log("Setting client records:", recordData);
            setClientRecords(recordData);
          } else {
            console.error('Invalid records data received:', recordData);
            setClientRecords([]);
          }
        } catch (recordErr) {
          console.error('Error fetching client records:', recordErr);
          toast({
            title: "Warning",
            description: "Failed to load client records, using empty list",
            variant: "destructive"
          });
          setClientRecords([]);
        }
        
        try {
          const recordTypeData = await fetchRecordTypes();
          setRecordTypes(recordTypeData);
          
          // Initialize with first record type if available
          if (recordTypeData.length > 0) {
            setNewRecord(prev => ({ ...prev, type: recordTypeData[0].name }));
          }
        } catch (typeErr) {
          console.error('Error fetching record types:', typeErr);
          toast({
            title: "Warning",
            description: "Failed to load record types",
            variant: "destructive"
          });
          setRecordTypes([]);
        }
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clientId, toast]);
  
  const handleAddRecord = async () => {
    try {
      if (!newRecord.type || !newRecord.description || !newRecord.value) {
        toast({
          title: "Error",
          description: "All fields are required",
          variant: "destructive"
        });
        return;
      }
      
      const date = newRecord.date instanceof Date 
        ? newRecord.date 
        : new Date(newRecord.date);
      
      const recordToAdd: Partial<ClientRecord> = {
        clientId,
        type: newRecord.type,
        description: newRecord.description,
        value: newRecord.value,
        date
      };
      
      const createdRecord = await createClientRecord(recordToAdd);
      
      setClientRecords(prev => [...prev, createdRecord]);
      
      // Reset form
      setNewRecord({
        type: recordTypes.length > 0 ? recordTypes[0].name : '',
        description: '',
        value: '',
        date: new Date(),
      });
      
      toast({
        title: "Success",
        description: "Record added successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive"
      });
    }
  };
  
  const handleEditRecord = (record: ClientRecord) => {
    setEditingRecord({...record});
  };
  
  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    try {
      const updatedRecord = await updateClientRecord(editingRecord.id, editingRecord);
      
      setClientRecords(prev => 
        prev.map(r => r.id === updatedRecord.id ? updatedRecord : r)
      );
      
      setEditingRecord(null);
      
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteRecord = async (id: number) => {
    try {
      await deleteClientRecord(id);
      
      setClientRecords(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  };
  
  const handleCancelEdit = () => {
    setEditingRecord(null);
  };
  
  // Handle saving client information
  const handleSaveClient = async () => {
    if (!client || !editableClient) return;
    
    try {
      setIsSaving(true);
      const updatedClient = await updateClient(client.id, editableClient);
      
      // Update the client state with the response
      setClient(updatedClient);
      
      toast({
        title: "Success",
        description: "Client information updated successfully",
      });
    } catch (err) {
      console.error('Error updating client:', err);
      toast({
        title: "Error",
        description: "Failed to update client information",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle input changes for client fields
  const handleClientChange = (field: string, value: string) => {
    setEditableClient(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle researching company data
  const [isResearching, setIsResearching] = useState(false);
  
  const handleResearchCompany = async () => {
    if (!editableClient.name) {
      toast({
        title: "Error",
        description: "Please enter a company name first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsResearching(true);
      toast({
        title: "Researching",
        description: `Gathering data about ${editableClient.name}...`,
      });
      
      const companyData = await researchCompany(editableClient.name);
      
      // Update editable client with researched data
      setEditableClient(prev => ({
        ...prev,
        ...companyData,
        // Don't overwrite existing values if they're already set
        email: prev.email || companyData.email,
        address: prev.address || companyData.address,
        businessType: prev.businessType || companyData.businessType,
      }));
      
      toast({
        title: "Success",
        description: "Company data retrieved successfully",
      });
    } catch (err) {
      console.error('Error researching company:', err);
      toast({
        title: "Error",
        description: "Failed to research company data",
        variant: "destructive"
      });
    } finally {
      setIsResearching(false);
    }
  };
  
  // Get record type color based on type name
  const getRecordTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Revenue': '#10b981', // Green
      'CGL': '#3b82f6',     // Blue 
      'Employees': '#f59e0b', // Amber
      'Property': '#ef4444'  // Red
    };
    return colors[type] || '#6b7280'; // Gray default
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Client Not Found</h1>
        <p>The requested client could not be found.</p>
      </div>
    );
  }

    // Debug: log the state of records
  console.log("Current clientRecords state:", clientRecords);
  
  // Use the records from the API directly 
  const recordsToDisplay = clientRecords;
  
  // Debug: log what will be displayed
  console.log("Records to display:", recordsToDisplay);
  
  return (
    <div className="px-4 py-4 w-full max-w-full">
      {/* Client Search Box */}
      <div className="mb-6">
        <SearchBar />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-row gap-6">
        {/* Left Column - Client Information */}
        <div className="w-2/5">
          <div className="mb-6">
            <Label htmlFor="companyName" className="block text-sm font-medium mb-1">Company</Label>
            <Input
              id="companyName" 
              value={editableClient.name || client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              className="mb-4"
            />
            
            <Label htmlFor="email" className="block text-sm font-medium mb-1">Email</Label>
            <Input
              id="email"
              value={editableClient.email || client.email || ''}
              onChange={(e) => handleClientChange('email', e.target.value)}
              className="mb-4"
              placeholder="client@acmemanu.com"
            />
            
            <Label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</Label>
            <Input 
              id="phone"
              value={editableClient.phone || client.phone || ''}
              onChange={(e) => handleClientChange('phone', e.target.value)}
              placeholder="604-555-1234" 
              className="mb-4"
            />
            
            <Label htmlFor="industry" className="block text-sm font-medium mb-1">Industry</Label>
            <select 
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
              value={editableClient.businessType || client.businessType || ''}
              onChange={(e) => handleClientChange('businessType', e.target.value)}
            >
              <option value="Fast food Restaurant">Fast food Restaurant</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
            </select>
            
            <Label htmlFor="province" className="block text-sm font-medium mb-1">Province</Label>
            <Input
              id="province"
              value={editableClient.province || client.province || ''}
              onChange={(e) => handleClientChange('province', e.target.value)}
              placeholder="BC" 
              className="mb-4"
            />
            
            <Label htmlFor="address" className="block text-sm font-medium mb-1">Address</Label>
            <Input
              id="address"
              value={editableClient.address || client.address || ''}
              onChange={(e) => handleClientChange('address', e.target.value)}
              placeholder="850 Harbourside Dr #401"
              className="mb-4"
            />
            
            <Label htmlFor="city" className="block text-sm font-medium mb-1">City</Label>
            <Input
              id="city"
              value={editableClient.city || client.city || ''}
              onChange={(e) => handleClientChange('city', e.target.value)}
              placeholder="North Vancouver"
              className="mb-4"
            />
            
            <Label htmlFor="postalCode" className="block text-sm font-medium mb-1">Postal Code</Label>
            <Input
              id="postalCode"
              value={editableClient.postalCode || client.postalCode || ''}
              onChange={(e) => handleClientChange('postalCode', e.target.value)}
              placeholder="V7P 3T7" 
              className="mb-4"
            />
            
            <div className="mt-6 flex gap-2">
              <Button 
                onClick={handleSaveClient}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                onClick={handleResearchCompany}
                disabled={isResearching || !editableClient.name}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded flex items-center"
              >
                <Search className="mr-2 h-4 w-4" />
                {isResearching ? 'Researching...' : 'Research'}
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded">Remove</Button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Records */}
        <div className="w-3/5">
          {/* Record Entry Form */}
          <div className="flex mb-2 space-x-2">
            <div className="w-1/4">
              <Label htmlFor="recordType" className="block text-sm font-medium mb-1">Type</Label>
              <select 
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={newRecord.type}
                onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="Property">Property</option>
                <option value="Revenue">Revenue</option>
                <option value="CGL">CGL</option>
                <option value="Employees">Employees</option>
              </select>
            </div>
            
            <div className="w-2/4">
              <Label htmlFor="recordDescription" className="block text-sm font-medium mb-1">Description</Label>
              <Input
                id="recordDescription"
                value={newRecord.description}
                onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Business Contents in a Lease"
                className="w-full"
              />
            </div>
            
            <div className="w-1/4">
              <Label htmlFor="recordValue" className="block text-sm font-medium mb-1">Value</Label>
              <Input
                id="recordValue"
                value={newRecord.value}
                onChange={(e) => setNewRecord(prev => ({ ...prev, value: e.target.value }))}
                placeholder="$1,500,000"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="recordDate" className="block text-sm font-medium">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newRecord.date, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newRecord.date}
                    onSelect={(date) => setNewRecord(prev => ({ ...prev, date: date || prev.date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              onClick={handleAddRecord}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-4 py-2 flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          
          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]"></th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Type
                    <InfoIcon className="inline-block ml-1 h-3 w-3" />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">
                    Description
                    <InfoIcon className="inline-block ml-1 h-3 w-3" />
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Value
                    <InfoIcon className="inline-block ml-1 h-3 w-3" />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Date
                    <InfoIcon className="inline-block ml-1 h-3 w-3" />
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recordsToDisplay.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div 
                        className="w-2 h-2 rounded-full mx-auto" 
                        style={{ backgroundColor: getRecordTypeColor(record.type) }}
                      ></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.type}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.description}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {record.value}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.date ? format(new Date(record.date), "MMM d, yyyy") : ""}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        onClick={() => record.id > 0 ? handleEditRecord(record) : null}
                      >
                        Edit →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* File Drop Zone */}
          <div className="mt-6 border-b border-gray-300 pb-2">
            <p className="text-gray-600 text-center">Drop documents here to add</p>
          </div>
        </div>
      </div>
      
      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Record</h2>
            
            <div className="mb-4">
              <Label htmlFor="editType" className="block text-sm font-medium mb-1">Type</Label>
              <select
                value={editingRecord.type}
                onChange={(e) => setEditingRecord({...editingRecord, type: e.target.value})}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="Property">Property</option>
                <option value="Revenue">Revenue</option>
                <option value="CGL">CGL</option>
                <option value="Employees">Employees</option>
              </select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="editDescription" className="block text-sm font-medium mb-1">Description</Label>
              <Input
                id="editDescription"
                value={editingRecord.description || ''}
                onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="editValue" className="block text-sm font-medium mb-1">Value</Label>
              <Input
                id="editValue"
                value={editingRecord.value || ''}
                onChange={(e) => setEditingRecord({...editingRecord, value: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="editDate" className="block text-sm font-medium mb-1">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="editDate"
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(
                      editingRecord.date instanceof Date 
                        ? editingRecord.date 
                        : new Date(editingRecord.date || new Date()),
                      "MMM d, yyyy"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editingRecord.date instanceof Date ? editingRecord.date : new Date(editingRecord.date || new Date())}
                    onSelect={(date) => {
                      if (date) {
                        setEditingRecord({
                          ...editingRecord, 
                          date: date,
                          createdAt: editingRecord.createdAt || new Date()
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRecord}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}