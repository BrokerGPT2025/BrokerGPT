import OpenAI from "openai";
import { type ChatMessage } from '@shared/schema';
import { getCarriersByRiskProfile } from './supabase';

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Helper function to interact with OpenAI
export async function generateChatResponse(messages: ChatMessage[], clientContext?: any) {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    // Add system message if not present
    if (!formattedMessages.some(msg => msg.role === 'system')) {
      formattedMessages.unshift({
        role: 'system',
        content: `You are BrokerGPT, an AI assistant specializing in insurance brokerage. 
        You help insurance agents find the best carriers for their clients based on risk profiles.
        Be professional, knowledgeable, and helpful. If you don't know something, say so honestly.
        Always provide accurate information about insurance policies, carriers, and risk management.`
      });
    }

    // Add client context if available
    if (clientContext) {
      formattedMessages.unshift({
        role: 'system',
        content: `The current client is ${clientContext.name}, a ${clientContext.businessType} business 
        located in ${clientContext.city}, ${clientContext.province}. 
        They have ${clientContext.employees} employees and annual revenue of $${clientContext.annualRevenue}.
        Keep this information in mind when answering queries.`
      });
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

// Extract client profile from conversation
export async function extractClientProfile(messages: ChatMessage[]) {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    formattedMessages.push({
      role: 'system',
      content: `Based on the conversation history, extract a client profile in JSON format with the following fields:
      name, address, city, province, postalCode, phone, email, businessType, annualRevenue, employees, 
      riskProfile (which should include industry, hazards, safety_measures, and any other relevant risk factors).
      If any field is unknown, use null. Only respond with the JSON object and nothing else.`
    });

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: formattedMessages,
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error extracting client profile:', error);
    throw error;
  }
}

// Recommend carriers based on client profile
export async function recommendCarriers(clientProfile: any) {
  try {
    // First, get carriers from database that match basic criteria
    const potentialCarriers = await getCarriersByRiskProfile(clientProfile.riskProfile);
    
    // Use OpenAI to rank and explain the recommendations
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an insurance specialist AI. Based on the client profile and potential carriers, 
          rank the top 3 carriers that best match the client's needs and explain why each is a good fit. 
          Consider the client's industry, size, location, and specific risks. 
          Return your response in JSON format with an array of objects containing 'carrier_id', 'name', 
          'rank', and 'explanation' fields. Only respond with the JSON object.`
        },
        {
          role: 'user',
          content: `Client Profile: ${JSON.stringify(clientProfile)}\n\nPotential Carriers: ${JSON.stringify(potentialCarriers)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error recommending carriers:', error);
    throw error;
  }
}
