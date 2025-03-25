import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertChatMessageSchema, clientProfileSchema, insertRecordTypeSchema, insertClientRecordSchema } from "@shared/schema";
import * as supabase from './supabase';
import { ZodError } from "zod";
import { pool, isDatabaseAvailable } from './db';

// Import the IPv4 enforcer to ensure all network connections use IPv4
import './ipv4-enforcer';

export async function registerRoutes(app: Express): Promise<Server> {
  // Add CORS middleware for cross-origin requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Allow requests from any origin in development
    // In production, restrict to your specific domain(s)
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.ALLOWED_ORIGIN || 'https://brokergpt.onrender.com'] 
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];
    
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Allow any origin in development, or if no specific origin matches
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Allow common headers and methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Add request size limits to prevent large payload attacks
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  
  // Create an API router
  const apiRouter = express.Router();
  app.use("/api", apiRouter);
  
  // Add health check endpoint for Render deployment
  apiRouter.get("/health", (req: Request, res: Response) => {
    const healthInfo = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        available: isDatabaseAvailable(),
        type: process.env.DATABASE_URL?.includes('neon.tech') ? "neon" : "postgresql"
      },
      memory: {
        heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
        heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        units: "MB"
      },
      uptime: Math.floor(process.uptime())
    };
    res.json(healthInfo);
  });

  // Carriers endpoints
  apiRouter.get("/carriers", async (req: Request, res: Response) => {
    try {
      const carriers = await storage.getCarriers();
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ message: "Failed to fetch carriers" });
    }
  });

  apiRouter.get("/carriers/:id", async (req: Request, res: Response) => {
    try {
      const carrier = await storage.getCarrier(Number(req.params.id));
      if (!carrier) {
        return res.status(404).json({ message: "Carrier not found" });
      }
      res.json(carrier);
    } catch (error) {
      console.error(`Error fetching carrier ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch carrier" });
    }
  });

  // Clients endpoints
  apiRouter.get("/clients", async (req: Request, res: Response) => {
    try {
      // Check if search query is provided
      const searchName = req.query.name as string | undefined;
      
      if (searchName) {
        // If name search parameter is provided, use getClientByName
        const client = await storage.getClientByName(searchName);
        if (client) {
          res.json([client]); // Return as array for consistency
        } else {
          res.json([]); // Return empty array if no match
        }
      } else {
        // Otherwise get all clients
        const clients = await storage.getClients();
        res.json(clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  apiRouter.get("/clients/:id", async (req: Request, res: Response) => {
    try {
      const client = await storage.getClient(Number(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error(`Error fetching client ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  apiRouter.post("/clients", async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const newClient = await storage.createClient(validatedData);
      res.status(201).json(newClient);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  apiRouter.patch("/clients/:id", async (req: Request, res: Response) => {
    try {
      const clientId = Number(req.params.id);
      const clientUpdate = clientProfileSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(clientId, clientUpdate);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error(`Error updating client ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Policies endpoints
  apiRouter.get("/clients/:clientId/policies", async (req: Request, res: Response) => {
    try {
      const clientId = Number(req.params.clientId);
      const policies = await storage.getClientPolicies(clientId);
      res.json(policies);
    } catch (error) {
      console.error(`Error fetching policies for client ${req.params.clientId}:`, error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  // Chat endpoints
  apiRouter.get("/chat/:clientId?", async (req: Request, res: Response) => {
    try {
      const clientId = req.params.clientId ? Number(req.params.clientId) : undefined;
      const messages = await storage.getChatMessages(clientId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  apiRouter.post("/chat", async (req: Request, res: Response) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const savedMessage = await storage.saveChatMessage(messageData);
      
      // If this is a user message, generate a response
      if (messageData.role === "user") {
        const clientId = messageData.clientId;
        const messages = await storage.getChatMessages(clientId || undefined);
        
        // Generate AI response
        const responseContent = await storage.generateChatResponse(messages, clientId || undefined);
        
        // Save AI response
        const aiMessage = {
          clientId: messageData.clientId,
          role: "assistant",
          content: responseContent
        };
        
        const savedAiMessage = await storage.saveChatMessage(aiMessage);
        
        // Return both messages
        res.status(201).json({
          userMessage: savedMessage,
          aiResponse: savedAiMessage
        });
      } else {
        res.status(201).json(savedMessage);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Client profile extraction
  apiRouter.post("/extract-profile", async (req: Request, res: Response) => {
    try {
      const { messages, clientId } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages are required and must be an array" });
      }
      
      const clientProfile = await storage.extractClientProfile(messages);
      
      // If clientId is provided, update the client with extracted information
      if (clientId) {
        await storage.updateClient(clientId, clientProfile);
      }
      
      res.json(clientProfile);
    } catch (error) {
      console.error("Error extracting client profile:", error);
      res.status(500).json({ message: "Failed to extract client profile" });
    }
  });

  // Carrier recommendations
  apiRouter.post("/recommend-carriers", async (req: Request, res: Response) => {
    try {
      const { clientProfile } = req.body;
      
      if (!clientProfile) {
        return res.status(400).json({ message: "Client profile is required" });
      }
      
      const recommendations = await storage.recommendCarriers(clientProfile);
      res.json(recommendations);
    } catch (error) {
      console.error("Error recommending carriers:", error);
      res.status(500).json({ message: "Failed to recommend carriers" });
    }
  });
  
  // Company research endpoint
  apiRouter.post("/research-company", async (req: Request, res: Response) => {
    try {
      // Get company name from request body
      const { companyName } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }
      
      console.log(`Received request to research company: ${companyName}`);
      
      // Generate company profile
      const companyProfile = await storage.generateCompanyProfile(companyName);
      
      // Return company profile
      res.json(companyProfile);
    } catch (error) {
      console.error("Error researching company:", error);
      res.status(500).json({ 
        message: "Failed to research company",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Cover Types endpoint - using direct PostgreSQL query for reliability
  apiRouter.get("/cover-types", async (req: Request, res: Response) => {
    try {
      // Check if database is available
      if (isDatabaseAvailable() && pool) {
        // Query the local PostgreSQL database directly
        // We've already checked that pool is not null above
        const result = await pool!.query('SELECT id, type FROM covertype');
        
        // Map to the expected format
        const coverTypes = result.rows.map((row: { id: number; type: string }) => ({
          id: row.id,
          name: row.type,
          description: `Insurance coverage for ${row.type}`
        }));
        
        console.log('Fetched cover types from PostgreSQL:', coverTypes);
        res.json(coverTypes);
      } else {
        // Fallback to in-memory default data if database is not available
        console.warn('Database not available, using fallback cover types data');
        const fallbackCoverTypes = [
          { id: 1, name: 'General Liability', description: 'Insurance coverage for General Liability' },
          { id: 2, name: 'Errors & Omissions', description: 'Insurance coverage for Errors & Omissions' },
          { id: 3, name: 'Cyber Liability', description: 'Insurance coverage for Cyber Liability' },
          { id: 4, name: 'Workers Compensation', description: 'Insurance coverage for Workers Compensation' },
          { id: 5, name: 'Business Interruption', description: 'Insurance coverage for Business Interruption' },
          { id: 6, name: 'Commercial Property', description: 'Insurance coverage for Commercial Property' },
          { id: 7, name: 'Directors & Officers', description: 'Insurance coverage for Directors & Officers' }
        ];
        res.json(fallbackCoverTypes);
      }
    } catch (error) {
      console.error("Error in cover types endpoint:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        if ('stack' in error) {
          console.error("Error stack:", error.stack);
        }
      }
      
      // Fallback to in-memory default data if there was an error
      console.warn('Error fetching cover types, using fallback data');
      const fallbackCoverTypes = [
        { id: 1, name: 'General Liability', description: 'Insurance coverage for General Liability' },
        { id: 2, name: 'Errors & Omissions', description: 'Insurance coverage for Errors & Omissions' },
        { id: 3, name: 'Cyber Liability', description: 'Insurance coverage for Cyber Liability' },
        { id: 4, name: 'Workers Compensation', description: 'Insurance coverage for Workers Compensation' },
        { id: 5, name: 'Business Interruption', description: 'Insurance coverage for Business Interruption' },
        { id: 6, name: 'Commercial Property', description: 'Insurance coverage for Commercial Property' },
        { id: 7, name: 'Directors & Officers', description: 'Insurance coverage for Directors & Officers' }
      ];
      res.json(fallbackCoverTypes);
    }
  });

  // Record Type endpoints
  apiRouter.get("/record-types", async (req: Request, res: Response) => {
    try {
      const recordTypes = await storage.getRecordTypes();
      res.json(recordTypes);
    } catch (error) {
      console.error("Error fetching record types:", error);
      res.status(500).json({ message: "Failed to fetch record types" });
    }
  });

  apiRouter.get("/record-types/:id", async (req: Request, res: Response) => {
    try {
      const recordType = await storage.getRecordType(Number(req.params.id));
      if (!recordType) {
        return res.status(404).json({ message: "Record type not found" });
      }
      res.json(recordType);
    } catch (error) {
      console.error(`Error fetching record type ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch record type" });
    }
  });

  apiRouter.post("/record-types", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRecordTypeSchema.parse(req.body);
      const newRecordType = await storage.createRecordType(validatedData);
      res.status(201).json(newRecordType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid record type data", errors: error.errors });
      }
      console.error("Error creating record type:", error);
      res.status(500).json({ message: "Failed to create record type" });
    }
  });

  // Client Record endpoints
  apiRouter.get("/clients/:clientId/records", async (req: Request, res: Response) => {
    try {
      const clientId = Number(req.params.clientId);
      const records = await storage.getClientRecords(clientId);
      res.json(records);
    } catch (error) {
      console.error(`Error fetching records for client ${req.params.clientId}:`, error);
      res.status(500).json({ message: "Failed to fetch client records" });
    }
  });

  apiRouter.get("/client-records/:id", async (req: Request, res: Response) => {
    try {
      const record = await storage.getClientRecord(Number(req.params.id));
      if (!record) {
        return res.status(404).json({ message: "Client record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error(`Error fetching client record ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch client record" });
    }
  });

  apiRouter.post("/client-records", async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientRecordSchema.parse(req.body);
      const newRecord = await storage.createClientRecord(validatedData);
      res.status(201).json(newRecord);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid client record data", errors: error.errors });
      }
      console.error("Error creating client record:", error);
      res.status(500).json({ message: "Failed to create client record" });
    }
  });

  apiRouter.patch("/client-records/:id", async (req: Request, res: Response) => {
    try {
      const recordId = Number(req.params.id);
      const recordUpdate = insertClientRecordSchema.partial().parse(req.body);
      const updatedRecord = await storage.updateClientRecord(recordId, recordUpdate);
      
      if (!updatedRecord) {
        return res.status(404).json({ message: "Client record not found" });
      }
      
      res.json(updatedRecord);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid client record data", errors: error.errors });
      }
      console.error(`Error updating client record ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update client record" });
    }
  });

  apiRouter.delete("/client-records/:id", async (req: Request, res: Response) => {
    try {
      const recordId = Number(req.params.id);
      const success = await storage.deleteClientRecord(recordId);
      
      if (!success) {
        return res.status(404).json({ message: "Client record not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting client record ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete client record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
