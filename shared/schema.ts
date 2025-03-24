import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Cover Types Interface (now fully dynamic from database)
export interface CoverType {
  id: number;
  name: string;
  description: string;
}

// Record Types table
export const recordTypes = pgTable("record_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description")
});

export const insertRecordTypeSchema = createInsertSchema(recordTypes).omit({
  id: true,
});

// Client Records table
export const clientRecords = pgTable("client_records", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  value: text("value"),
  date: timestamp("date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientRecordSchema = createInsertSchema(clientRecords).omit({
  id: true,
  createdAt: true,
});

// Carriers table
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  specialties: text("specialties").array(),
  riskAppetite: jsonb("risk_appetite"),
  minPremium: integer("min_premium"),
  maxPremium: integer("max_premium"),
  regions: text("regions").array(),
  businessTypes: text("business_types").array(),
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  phone: text("phone"),
  email: text("email"),
  businessType: text("business_type"),
  annualRevenue: integer("annual_revenue"),
  employees: integer("employees"),
  riskProfile: jsonb("risk_profile"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

// Policies table
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  carrierId: integer("carrier_id").notNull(),
  policyType: text("policy_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  premium: integer("premium"),
  status: text("status").notNull(),
  coverageLimits: jsonb("coverage_limits"),
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// Define schemas for frontend validation
export const clientProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  businessType: z.string().optional(),
  annualRevenue: z.number().optional(),
  employees: z.number().optional(),
  riskProfile: z.record(z.any()).optional(),
});

// Types
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ClientProfile = z.infer<typeof clientProfileSchema>;

export type RecordType = typeof recordTypes.$inferSelect;
export type InsertRecordType = z.infer<typeof insertRecordTypeSchema>;

export type ClientRecord = typeof clientRecords.$inferSelect;
export type InsertClientRecord = z.infer<typeof insertClientRecordSchema>;

// Export CoverType interface (already defined above)
