import { apiRequest } from './queryClient';
import { 
  ChatMessage, 
  Client, 
  Carrier, 
  Policy, 
  ClientProfile, 
  RecordType, 
  ClientRecord 
} from '@shared/schema';

export const fetchCoverTypes = async (): Promise<{ id: number; name: string; description: string }[]> => {
  const response = await apiRequest('GET', '/api/cover-types');
  return response.json();
};

export const fetchCarriers = async (): Promise<Carrier[]> => {
  const response = await apiRequest('GET', '/api/carriers');
  return response.json();
};

export const fetchCarrier = async (id: number): Promise<Carrier> => {
  const response = await apiRequest('GET', `/api/carriers/${id}`);
  return response.json();
};

export const fetchClients = async (searchName?: string | undefined): Promise<Client[]> => {
  const url = searchName 
    ? `/api/clients?name=${encodeURIComponent(searchName)}` 
    : '/api/clients';
  const response = await apiRequest('GET', url);
  return response.json();
};

// This overload is for react-query compatibility
export const fetchClientsQueryFn = async (): Promise<Client[]> => {
  return fetchClients();
};

export const fetchClient = async (id: number): Promise<Client> => {
  const response = await apiRequest('GET', `/api/clients/${id}`);
  return response.json();
};

export const createClient = async (client: Partial<Client>): Promise<Client> => {
  const response = await apiRequest('POST', '/api/clients', client);
  return response.json();
};

export const updateClient = async (id: number, client: Partial<Client>): Promise<Client> => {
  const response = await apiRequest('PATCH', `/api/clients/${id}`, client);
  return response.json();
};

export const fetchClientPolicies = async (clientId: number): Promise<Policy[]> => {
  const response = await apiRequest('GET', `/api/clients/${clientId}/policies`);
  return response.json();
};

export const fetchChatMessages = async (clientId?: number): Promise<ChatMessage[]> => {
  const url = clientId ? `/api/chat/${clientId}` : '/api/chat';
  const response = await apiRequest('GET', url);
  return response.json();
};

export const sendChatMessage = async (content: string, clientId?: number): Promise<{
  userMessage: ChatMessage;
  aiResponse: ChatMessage;
}> => {
  const messageData = {
    role: 'user',
    content,
    clientId
  };
  
  const response = await apiRequest('POST', '/api/chat', messageData);
  return response.json();
};

export const extractClientProfile = async (messages: ChatMessage[], clientId?: number): Promise<ClientProfile> => {
  const response = await apiRequest('POST', '/api/extract-profile', {
    messages,
    clientId
  });
  return response.json();
};

export const recommendCarriers = async (clientProfile: ClientProfile): Promise<{
  carriers: Array<{
    carrier_id: number;
    name: string;
    rank: number;
    explanation: string;
  }>;
}> => {
  const response = await apiRequest('POST', '/api/recommend-carriers', {
    clientProfile
  });
  return response.json();
};

// Record Type operations
export const fetchRecordTypes = async (): Promise<RecordType[]> => {
  const response = await apiRequest('GET', '/api/record-types');
  return response.json();
};

export const fetchRecordType = async (id: number): Promise<RecordType> => {
  const response = await apiRequest('GET', `/api/record-types/${id}`);
  return response.json();
};

export const createRecordType = async (recordType: Partial<RecordType>): Promise<RecordType> => {
  const response = await apiRequest('POST', '/api/record-types', recordType);
  return response.json();
};

// Client Record operations
export const fetchClientRecords = async (clientId: number): Promise<ClientRecord[]> => {
  try {
    console.log(`Fetching client records for client ID: ${clientId}`);
    const response = await apiRequest('GET', `/api/clients/${clientId}/records`);
    const records = await response.json();
    
    if (records && Array.isArray(records) && records.length > 0) {
      console.log(`Received ${records.length} client records for client ID: ${clientId}`, records);
      
      // Ensure all dates are properly formatted
      return records.map((record: any) => ({
        ...record,
        date: record.date ? new Date(record.date) : new Date(),
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date()
      }));
    }
    
    console.warn(`No records found for client ID: ${clientId}`);
    return [];
  } catch (error) {
    console.error('Error fetching client records:', error);
    throw error;
  }
};

export const fetchClientRecord = async (id: number): Promise<ClientRecord> => {
  const response = await apiRequest('GET', `/api/client-records/${id}`);
  return response.json();
};

export const createClientRecord = async (record: Partial<ClientRecord>): Promise<ClientRecord> => {
  const response = await apiRequest('POST', '/api/client-records', record);
  return response.json();
};

export const updateClientRecord = async (id: number, record: Partial<ClientRecord>): Promise<ClientRecord> => {
  const response = await apiRequest('PATCH', `/api/client-records/${id}`, record);
  return response.json();
};

export const deleteClientRecord = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/client-records/${id}`);
};

export const researchCompany = async (companyName: string): Promise<Partial<Client>> => {
  const response = await apiRequest('POST', '/api/research-company', { companyName });
  return response.json();
};
