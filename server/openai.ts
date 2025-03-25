import OpenAI from "openai";
import { type ChatMessage } from '@shared/schema';
import { getCarriersByRiskProfile } from './supabase';

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY not found in environment variables. AI features will be limited.");
}

// Initialize OpenAI with configuration
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 60000, // 60 second timeout
  maxRetries: 3   // Retry API calls up to 3 times
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// OpenAI rate limit tracking
const rateLimitInfo = {
  isRateLimited: false,
  resetTime: null,
  lastError: null
};

// Helper function to interact with OpenAI
export async function generateChatResponse(messages: ChatMessage[], clientContext?: any) {
  // Check for rate limiting
  if (rateLimitInfo.isRateLimited) {
    const now = new Date();
    if (rateLimitInfo.resetTime && now < rateLimitInfo.resetTime) {
      console.warn("⚠️ OpenAI API rate limited, waiting for reset");
      return {
        role: "assistant",
        content: "I'm currently experiencing high demand. Please try again in a few moments.",
        error: "RATE_LIMITED"
      };
    } else {
      // Reset rate limit if time has passed
      rateLimitInfo.isRateLimited = false;
    }
  }
  
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

    console.log(`Making OpenAI API call with ${formattedMessages.length} messages`);
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 800,
    });
    
    const duration = Date.now() - startTime;
    console.log(`OpenAI API call completed in ${duration}ms`);

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    
    // Handle rate limit errors
    if (error?.status === 429) {
      console.warn("⚠️ OpenAI API rate limit exceeded");
      
      // Get reset time from headers if available
      const resetTime = error?.headers?.get('x-ratelimit-reset-tokens')
        ? new Date(parseInt(error.headers.get('x-ratelimit-reset-tokens')) * 1000)
        : new Date(Date.now() + 60000); // Default to 1 minute if no header
      
      rateLimitInfo.isRateLimited = true;
      rateLimitInfo.resetTime = resetTime;
      rateLimitInfo.lastError = error;
      
      return "I'm currently experiencing high demand. Please try again in a few moments.";
    }
    
    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.message?.includes('timeout')) {
      return "I'm sorry, but the request timed out. This might be due to high server load. Please try again shortly.";
    }
    
    // Default error handling
    return "I'm sorry, but I encountered an error processing your request. Please try again later.";
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

    // Check for rate limiting
    if (rateLimitInfo.isRateLimited) {
      const now = new Date();
      if (rateLimitInfo.resetTime && now < rateLimitInfo.resetTime) {
        console.warn("⚠️ OpenAI API rate limited, skipping client profile extraction");
        return { error: "Rate limited. Please try again later." };
      } else {
        rateLimitInfo.isRateLimited = false;
      }
    }
    
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: formattedMessages,
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    const duration = Date.now() - startTime;
    console.log(`Client profile extraction completed in ${duration}ms`);

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error: any) {
    console.error('Error extracting client profile:', error);
    
    // Handle rate limit errors
    if (error?.status === 429) {
      rateLimitInfo.isRateLimited = true;
      rateLimitInfo.resetTime = new Date(Date.now() + 60000); // 1 minute default
      return { error: "Rate limited. Please try again later." };
    }
    
    // Return empty object instead of throwing
    return { error: "Failed to extract client profile" };
  }
}

// Recommend carriers based on client profile
export async function recommendCarriers(clientProfile: any) {
  try {
    // First, get carriers from database that match basic criteria
    const potentialCarriers = await getCarriersByRiskProfile(clientProfile.riskProfile);
    
    // Use OpenAI to rank and explain the recommendations
    // Check for rate limiting before making API call
    if (rateLimitInfo.isRateLimited) {
      const now = new Date();
      if (rateLimitInfo.resetTime && now < rateLimitInfo.resetTime) {
        console.warn("⚠️ OpenAI API rate limited, skipping carrier recommendations");
        return { 
          recommendations: [], 
          error: "Rate limited. Please try again later."
        };
      } else {
        rateLimitInfo.isRateLimited = false;
      }
    }
    
    const startTime = Date.now();
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
    
    const duration = Date.now() - startTime;
    console.log(`Carrier recommendations completed in ${duration}ms`);

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error: any) {
    console.error('Error recommending carriers:', error);
    
    // Handle rate limit errors
    if (error?.status === 429) {
      rateLimitInfo.isRateLimited = true;
      rateLimitInfo.resetTime = new Date(Date.now() + 60000); // 1 minute default
      return { 
        recommendations: [], 
        error: "Rate limited. Please try again later."
      };
    }
    
    // Return empty object instead of throwing
    return { 
      recommendations: [],
      error: "Failed to generate carrier recommendations"
    };
  }
}
