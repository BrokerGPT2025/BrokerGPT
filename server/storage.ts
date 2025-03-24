import {
  Carrier,
  Client,
  Policy,
  ChatMessage,
  InsertClient,
  InsertCarrier,
  InsertPolicy,
  InsertChatMessage,
  RecordType,
  ClientRecord,
  InsertRecordType,
  InsertClientRecord
} from "@shared/schema";
import {
  supabase,
  getCarriers,
  getClientById,
  createClientRecord,
  getClientPolicies,
  saveChatMessage,
  getClientChatHistory,
  getCarriersByRiskProfile
} from "./supabase";
import { generateChatResponse, extractClientProfile, recommendCarriers } from "./openai";
import { generateCompanyProfile as scrapeCompanyProfile } from "./webScraper";

export interface IStorage {
  // Carrier operations
  getCarrier(id: number): Promise<Carrier | undefined>;
  getCarriers(): Promise<Carrier[]>;
  createCarrier(carrier: InsertCarrier): Promise<Carrier>;
  getCarriersByRiskProfile(profile: any): Promise<Carrier[]>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  getClientByName(name: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;

  // Policy operations
  getPolicy(id: number): Promise<Policy | undefined>;
  getClientPolicies(clientId: number): Promise<Policy[]>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;

  // Chat operations
  getChatMessages(clientId?: number): Promise<ChatMessage[]>;
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  generateChatResponse(messages: ChatMessage[], clientId?: number): Promise<string>;
  
  // Record type operations
  getRecordTypes(): Promise<RecordType[]>;
  getRecordType(id: number): Promise<RecordType | undefined>;
  createRecordType(recordType: InsertRecordType): Promise<RecordType>;
  
  // Client record operations
  getClientRecords(clientId: number): Promise<ClientRecord[]>;
  getClientRecord(id: number): Promise<ClientRecord | undefined>;
  createClientRecord(record: InsertClientRecord): Promise<ClientRecord>;
  updateClientRecord(id: number, record: Partial<ClientRecord>): Promise<ClientRecord | undefined>;
  deleteClientRecord(id: number): Promise<boolean>;
  
  // Profile and recommendation operations
  extractClientProfile(messages: ChatMessage[]): Promise<any>;
  recommendCarriers(clientProfile: any): Promise<any>;
  
  // Company research operations
  generateCompanyProfile(companyName: string): Promise<Partial<Client>>;
}

export class MemStorage implements IStorage {
  private carriers: Map<number, Carrier>;
  private clients: Map<number, Client>;
  private policies: Map<number, Policy>;
  private chatMessages: Map<number, ChatMessage>;
  private recordTypes: Map<number, RecordType>;
  private clientRecords: Map<number, ClientRecord>;
  private currentCarrierId: number;
  private currentClientId: number;
  private currentPolicyId: number;
  private currentMessageId: number;
  private currentRecordTypeId: number;
  private currentClientRecordId: number;

  constructor() {
    this.carriers = new Map();
    this.clients = new Map();
    this.policies = new Map();
    this.chatMessages = new Map();
    this.recordTypes = new Map();
    this.clientRecords = new Map();
    this.currentCarrierId = 1;
    this.currentClientId = 1;
    this.currentPolicyId = 1;
    this.currentMessageId = 1;
    this.currentRecordTypeId = 1;
    this.currentClientRecordId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample carriers
    const sampleCarriers = [
      {
        id: this.currentCarrierId++,
        name: "Acme Insurance",
        website: "https://acmeinsurance.example",
        phone: "555-123-4567",
        email: "info@acmeinsurance.example",
        specialties: ["Property", "General Liability", "Business Interruption"],
        riskAppetite: {
          industries: ["Retail", "Office", "Light Manufacturing"],
          company_size: { min: 5, max: 500 }
        },
        minPremium: 1000,
        maxPremium: 50000,
        regions: ["West Coast", "Midwest"],
        businessTypes: ["Retail", "Office", "Manufacturing"]
      },
      {
        id: this.currentCarrierId++,
        name: "Liberty Shield",
        website: "https://libertyshield.example",
        phone: "555-987-6543",
        email: "info@libertyshield.example",
        specialties: ["Workers Comp", "Property", "Product Liability"],
        riskAppetite: {
          industries: ["Construction", "Transportation", "Healthcare"],
          company_size: { min: 10, max: 1000 }
        },
        minPremium: 5000,
        maxPremium: 100000,
        regions: ["Northeast", "Southeast"],
        businessTypes: ["Construction", "Healthcare", "Transportation"]
      },
      {
        id: this.currentCarrierId++,
        name: "Pacific Mutual",
        website: "https://pacificmutual.example",
        phone: "555-555-5555",
        email: "info@pacificmutual.example",
        specialties: ["Errors & Omissions", "Cyber", "Business Interruption"],
        riskAppetite: {
          industries: ["Technology", "Financial Services", "Professional Services"],
          company_size: { min: 1, max: 200 }
        },
        minPremium: 2000,
        maxPremium: 75000,
        regions: ["West Coast", "Mountain", "Southwest"],
        businessTypes: ["Technology", "Financial", "Professional Services"]
      }
    ];

    sampleCarriers.forEach(carrier => {
      this.carriers.set(carrier.id, carrier as Carrier);
    });
    
    // Sample record types
    const sampleRecordTypes = [
      {
        id: this.currentRecordTypeId++,
        name: "Property",
        description: "Property insurance coverage"
      },
      {
        id: this.currentRecordTypeId++,
        name: "Revenue",
        description: "Annual revenue information"
      },
      {
        id: this.currentRecordTypeId++,
        name: "CGL",
        description: "Commercial General Liability coverage"
      },
      {
        id: this.currentRecordTypeId++,
        name: "Employees",
        description: "Employee count and information"
      }
    ];
    
    sampleRecordTypes.forEach(type => {
      this.recordTypes.set(type.id, type as RecordType);
    });
    
    // Sample clients
    const sampleClients: Client[] = [
      {
        id: this.currentClientId++,
        name: "Chicko Chicken Ltd",
        address: "850 Harbourside Dr #401",
        city: "North Vancouver",
        province: "BC",
        postalCode: "V7P 3T7",
        phone: "604-555-1234",
        email: "client@acmemanu.com",
        businessType: "Fast food Restaurant",
        annualRevenue: 1500000,
        employees: 80,
        riskProfile: {
          industry: "Food Service",
          hazards: ["Kitchen Equipment", "Food Safety"],
          safetyMeasures: ["Regular Inspections", "Staff Training"]
        },
        createdAt: new Date()
      },
      {
        id: this.currentClientId++,
        name: "Acme Manufacturing",
        address: "123 Industrial Way",
        city: "Vancouver",
        province: "BC",
        postalCode: "V5T 1Z1",
        phone: "604-555-2345",
        email: "info@acmemfg.com",
        businessType: "Manufacturing",
        annualRevenue: 5000000,
        employees: 150,
        riskProfile: {
          industry: "Manufacturing",
          hazards: ["Heavy Machinery", "Chemical Exposure"],
          safetyMeasures: ["PPE Requirements", "Safety Training"]
        },
        createdAt: new Date()
      },
      {
        id: this.currentClientId++,
        name: "Beta Technologies",
        address: "456 Tech Park Drive",
        city: "Burnaby",
        province: "BC",
        postalCode: "V3N 4R7",
        phone: "604-555-3456",
        email: "contact@betatech.com",
        businessType: "Software Development",
        annualRevenue: 3500000,
        employees: 45,
        riskProfile: {
          industry: "Technology",
          hazards: ["Cyber Risk", "Intellectual Property"],
          safetyMeasures: ["Security Protocols", "Data Encryption"]
        },
        createdAt: new Date()
      },
      {
        id: this.currentClientId++,
        name: "Gamma Retail Group",
        address: "789 Shopping Center Blvd",
        city: "Richmond",
        province: "BC",
        postalCode: "V6Y 2B3",
        phone: "604-555-4567",
        email: "service@gammaretail.com",
        businessType: "Retail",
        annualRevenue: 8750000,
        employees: 220,
        riskProfile: {
          industry: "Retail",
          hazards: ["Theft", "Slip and Fall"],
          safetyMeasures: ["Security Systems", "Floor Maintenance"]
        },
        createdAt: new Date()
      },
      {
        id: this.currentClientId++,
        name: "Delta Logistics",
        address: "1010 Harbor Front",
        city: "Delta",
        province: "BC",
        postalCode: "V4K 3N2",
        phone: "604-555-5678",
        email: "operations@deltalogistics.com",
        businessType: "Transportation",
        annualRevenue: 12000000,
        employees: 185,
        riskProfile: {
          industry: "Transportation",
          hazards: ["Vehicle Accidents", "Cargo Damage"],
          safetyMeasures: ["Driver Training", "Vehicle Maintenance"]
        },
        createdAt: new Date()
      },
      {
        id: this.currentClientId++,
        name: "Epsilon Health Services",
        address: "2020 Medical Drive",
        city: "Surrey",
        province: "BC",
        postalCode: "V3T 0H1",
        phone: "604-555-6789",
        email: "admin@epsilonhealth.com",
        businessType: "Healthcare",
        annualRevenue: 6200000,
        employees: 110,
        riskProfile: {
          industry: "Healthcare",
          hazards: ["Medical Malpractice", "Biohazards"],
          safetyMeasures: ["Certification Training", "Waste Management"]
        },
        createdAt: new Date()
      }
    ];
    
    // Add all sample clients to the in-memory store
    sampleClients.forEach(client => {
      this.clients.set(client.id, client);
    });
    
    // Use the first client (Chicko Chicken) as our reference for sample records
    const sampleClient = sampleClients[0];
    
    // Sample client records
    const sampleRecords = [
      {
        id: this.currentClientRecordId++,
        clientId: sampleClient.id,
        type: "Property",
        description: "Business Contents in a Lease",
        value: "1500000",
        date: new Date("2025-05-15"),
        createdAt: new Date()
      },
      {
        id: this.currentClientRecordId++,
        clientId: sampleClient.id,
        type: "Revenue",
        description: "Fast food Restaurant",
        value: "850000",
        date: new Date("2025-03-01"),
        createdAt: new Date()
      },
      {
        id: this.currentClientRecordId++,
        clientId: sampleClient.id,
        type: "CGL",
        description: "Liability policy #AD5674",
        value: "5000000",
        date: new Date("2026-09-05"),
        createdAt: new Date()
      },
      {
        id: this.currentClientRecordId++,
        clientId: sampleClient.id,
        type: "Employees",
        description: "Employee count as of Date",
        value: "80",
        date: new Date("2026-01-05"),
        createdAt: new Date()
      }
    ];
    
    sampleRecords.forEach(record => {
      this.clientRecords.set(record.id, record as ClientRecord);
    });
  }

  // Carrier operations
  async getCarrier(id: number): Promise<Carrier | undefined> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Carrier;
    } catch (error) {
      console.error(`Error fetching carrier: ${error}`);
      // Fall back to in-memory
      return this.carriers.get(id);
    }
  }

  async getCarriers(): Promise<Carrier[]> {
    try {
      // Try to get from Supabase first
      const carriers = await getCarriers();
      if (carriers && carriers.length) {
        return carriers as Carrier[];
      }
    } catch (error) {
      console.error(`Error fetching carriers: ${error}`);
    }
    // Fall back to in-memory
    return Array.from(this.carriers.values());
  }

  async createCarrier(carrier: InsertCarrier): Promise<Carrier> {
    try {
      // Try to create in Supabase first
      const { data, error } = await supabase
        .from('carriers')
        .insert([carrier])
        .select();
      
      if (error) throw error;
      return data[0] as Carrier;
    } catch (error) {
      console.error(`Error creating carrier: ${error}`);
      // Fall back to in-memory
      const id = this.currentCarrierId++;
      const newCarrier = { ...carrier, id } as Carrier;
      this.carriers.set(id, newCarrier);
      return newCarrier;
    }
  }

  async getCarriersByRiskProfile(profile: any): Promise<Carrier[]> {
    try {
      // Try to get from Supabase first
      const carriers = await getCarriersByRiskProfile(profile);
      if (carriers && carriers.length) {
        return carriers as Carrier[];
      }
    } catch (error) {
      console.error(`Error fetching carriers by risk profile: ${error}`);
    }
    
    // Fall back to in-memory filtering
    return Array.from(this.carriers.values()).filter(carrier => {
      // Use type assertion to help TypeScript understand the structure
      const riskAppetite = carrier.riskAppetite || {} as any;
      
      // Simple filtering logic (would be more sophisticated in a real app)
      if (profile.industry && riskAppetite.industries && 
          !riskAppetite.industries.includes(profile.industry)) {
        return false;
      }
      
      if (profile.size && riskAppetite.company_size && 
          profile.size > riskAppetite.company_size.max) {
        return false;
      }
      
      return true;
    });
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    try {
      // Try to get from Supabase first
      const client = await getClientById(id);
      if (client) {
        return client as Client;
      }
    } catch (error) {
      console.error(`Error fetching client: ${error}`);
    }
    // Fall back to in-memory
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) throw error;
      return data as Client[];
    } catch (error) {
      console.error(`Error fetching clients: ${error}`);
    }
    
    // Fall back to in-memory
    return Array.from(this.clients.values());
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${name}%`)
        .limit(1);
      
      if (error) throw error;
      return data[0] as Client;
    } catch (error) {
      console.error(`Error fetching client by name: ${error}`);
    }
    
    // Fall back to in-memory
    return Array.from(this.clients.values()).find(
      client => client.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      // Try to create in Supabase first
      const newClient = await createClientRecord(client as any);
      if (newClient) {
        return newClient as Client;
      }
    } catch (error) {
      console.error(`Error creating client: ${error}`);
    }
    
    // Fall back to in-memory
    const id = this.currentClientId++;
    const timestamp = new Date();
    const newClient = { ...client, id, createdAt: timestamp } as Client;
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientUpdate: Partial<Client>): Promise<Client | undefined> {
    try {
      // Try to update in Supabase first
      const { data, error } = await supabase
        .from('clients')
        .update(clientUpdate)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0] as Client;
    } catch (error) {
      console.error(`Error updating client: ${error}`);
    }
    
    // Fall back to in-memory
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientUpdate };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  // Policy operations
  async getPolicy(id: number): Promise<Policy | undefined> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Policy;
    } catch (error) {
      console.error(`Error fetching policy: ${error}`);
    }
    
    // Fall back to in-memory
    return this.policies.get(id);
  }

  async getClientPolicies(clientId: number): Promise<Policy[]> {
    try {
      // Try to get from Supabase first
      const policies = await getClientPolicies(clientId);
      if (policies) {
        return policies as Policy[];
      }
    } catch (error) {
      console.error(`Error fetching client policies: ${error}`);
    }
    
    // Fall back to in-memory
    return Array.from(this.policies.values()).filter(
      policy => policy.clientId === clientId
    );
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    try {
      // Try to create in Supabase first
      const { data, error } = await supabase
        .from('policies')
        .insert([policy])
        .select();
      
      if (error) throw error;
      return data[0] as Policy;
    } catch (error) {
      console.error(`Error creating policy: ${error}`);
    }
    
    // Fall back to in-memory
    const id = this.currentPolicyId++;
    const newPolicy = { ...policy, id } as Policy;
    this.policies.set(id, newPolicy);
    return newPolicy;
  }

  // Chat operations
  async getChatMessages(clientId?: number): Promise<ChatMessage[]> {
    try {
      if (clientId) {
        // Try to get from Supabase first
        const messages = await getClientChatHistory(clientId);
        if (messages) {
          return messages as ChatMessage[];
        }
      }
    } catch (error) {
      console.error(`Error fetching chat messages: ${error}`);
    }
    
    // Fall back to in-memory
    const messages = Array.from(this.chatMessages.values());
    if (clientId) {
      return messages.filter(msg => msg.clientId === clientId);
    }
    return messages;
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    try {
      // Try to save in Supabase first
      const savedMessage = await saveChatMessage(message);
      if (savedMessage) {
        return savedMessage as ChatMessage;
      }
    } catch (error) {
      console.error(`Error saving chat message: ${error}`);
    }
    
    // Fall back to in-memory
    const id = this.currentMessageId++;
    const timestamp = new Date();
    const newMessage = { ...message, id, timestamp } as ChatMessage;
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  async generateChatResponse(messages: ChatMessage[], clientId?: number): Promise<string> {
    let clientContext = undefined;
    
    if (clientId) {
      clientContext = await this.getClient(clientId);
    }
    
    const response = await generateChatResponse(messages, clientContext);
    return response || "I'm sorry, I couldn't generate a response at this time.";
  }

  // Record type operations
  async getRecordTypes(): Promise<RecordType[]> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('record_types')
        .select('*');
      
      if (error) throw error;
      return data as RecordType[];
    } catch (error) {
      console.error(`Error fetching record types: ${error}`);
    }
    
    // Fall back to in-memory
    return Array.from(this.recordTypes.values());
  }
  
  async getRecordType(id: number): Promise<RecordType | undefined> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('record_types')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as RecordType;
    } catch (error) {
      console.error(`Error fetching record type: ${error}`);
    }
    
    // Fall back to in-memory
    return this.recordTypes.get(id);
  }
  
  async createRecordType(recordType: InsertRecordType): Promise<RecordType> {
    try {
      // Try to create in Supabase first
      const { data, error } = await supabase
        .from('record_types')
        .insert([recordType])
        .select();
      
      if (error) throw error;
      return data[0] as RecordType;
    } catch (error) {
      console.error(`Error creating record type: ${error}`);
    }
    
    // Fall back to in-memory
    const id = this.currentRecordTypeId++;
    const newRecordType = { ...recordType, id } as RecordType;
    this.recordTypes.set(id, newRecordType);
    return newRecordType;
  }
  
  // Client record operations
  async getClientRecords(clientId: number): Promise<ClientRecord[]> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('client_records')
        .select('*')
        .eq('clientId', clientId);
      
      if (error) throw error;
      return data as ClientRecord[];
    } catch (error) {
      console.error(`Error fetching client records: ${error}`);
    }
    
    // Fall back to in-memory
    return Array.from(this.clientRecords.values()).filter(
      record => record.clientId === clientId
    );
  }
  
  async getClientRecord(id: number): Promise<ClientRecord | undefined> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('client_records')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ClientRecord;
    } catch (error) {
      console.error(`Error fetching client record: ${error}`);
    }
    
    // Fall back to in-memory
    return this.clientRecords.get(id);
  }
  
  async createClientRecord(record: InsertClientRecord): Promise<ClientRecord> {
    try {
      // Try to create in Supabase first
      const { data, error } = await supabase
        .from('client_records')
        .insert([record])
        .select();
      
      if (error) throw error;
      return data[0] as ClientRecord;
    } catch (error) {
      console.error(`Error creating client record: ${error}`);
    }
    
    // Fall back to in-memory
    const id = this.currentClientRecordId++;
    const timestamp = new Date();
    const newRecord = { ...record, id, createdAt: timestamp } as ClientRecord;
    this.clientRecords.set(id, newRecord);
    return newRecord;
  }
  
  async updateClientRecord(id: number, recordUpdate: Partial<ClientRecord>): Promise<ClientRecord | undefined> {
    try {
      // Try to update in Supabase first
      const { data, error } = await supabase
        .from('client_records')
        .update(recordUpdate)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0] as ClientRecord;
    } catch (error) {
      console.error(`Error updating client record: ${error}`);
    }
    
    // Fall back to in-memory
    const record = this.clientRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...recordUpdate };
    this.clientRecords.set(id, updatedRecord);
    return updatedRecord;
  }
  
  async deleteClientRecord(id: number): Promise<boolean> {
    try {
      // Try to delete from Supabase first
      const { error } = await supabase
        .from('client_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting client record: ${error}`);
    }
    
    // Fall back to in-memory
    return this.clientRecords.delete(id);
  }

  // Profile and recommendation operations
  async extractClientProfile(messages: ChatMessage[]): Promise<any> {
    return extractClientProfile(messages);
  }

  async recommendCarriers(clientProfile: any): Promise<any> {
    return recommendCarriers(clientProfile);
  }
  
  async generateCompanyProfile(companyName: string): Promise<Partial<Client>> {
    try {
      console.log(`Researching company profile for: ${companyName}`);
      
      // Call the web scraper functionality
      const profileData = await scrapeCompanyProfile(companyName);
      
      console.log(`Generated profile data for ${companyName}:`, profileData);
      
      // Format the returned data to match the Client structure
      // Only include fields that were actually found through web scraping
      const clientProfile: Partial<Client> = {
        name: profileData.name,
      };
      
      // Only add fields if they exist in the profile data
      if (profileData.address) clientProfile.address = profileData.address;
      if (profileData.city) clientProfile.city = profileData.city;
      if (profileData.province) clientProfile.province = profileData.province;
      if (profileData.postalCode) clientProfile.postalCode = profileData.postalCode;
      if (profileData.phone) clientProfile.phone = profileData.phone;
      if (profileData.email) clientProfile.email = profileData.email;
      if (profileData.businessType) clientProfile.businessType = profileData.businessType;
      if (profileData.annualRevenue) clientProfile.annualRevenue = profileData.annualRevenue;
      if (profileData.employees) clientProfile.employees = profileData.employees;
      if (profileData.riskProfile) clientProfile.riskProfile = profileData.riskProfile;
      
      return clientProfile;
    } catch (error) {
      console.error(`Error generating company profile: ${error}`);
      throw error;
    }
  }
}

import { isDatabaseAvailable } from './db';

// Use MemStorage if the database is not available
// In the future, we can implement a DatabaseStorage class that uses the database
export const storage = new MemStorage();
