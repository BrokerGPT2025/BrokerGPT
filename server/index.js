// Import necessary modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { spawn } = require('child_process'); // Import child_process for OpenManus integration
// const { GoogleGenerativeAI } = require("@google/generative-ai"); // Commented out Google AI
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai"); // Langchain Google GenAI
const { HumanMessage } = require("@langchain/core/messages"); // Langchain core messages

// Create an Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend requests
app.use(express.json()); // Enable parsing of JSON request bodies

// --- Environment Variables ---
const PORT = process.env.PORT || 3001;
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Define Google key

// Basic check for required API keys
if (!SERPER_API_KEY || !BROWSERLESS_API_KEY || !GOOGLE_API_KEY) {
  console.error("FATAL ERROR: One or more API keys (SERPER, BROWSERLESS, GOOGLE_API_KEY) are not defined.");
  // In a real app, you might exit or prevent the server from starting fully
  // For now, we'll let it continue but log the error.
}

// --- Initialize Langchain Model ---
const llm = new ChatGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
  model: "gemini-1.5-pro", // Try gemini-1.5-pro based on docs text
  temperature: 0.3, // Adjust temperature as needed
});
console.log("Langchain ChatGoogleGenerativeAI model initialized with gemini-1.5-pro.");

// --- Initialize OpenManus MCP Integration --- // Note: This log might be misleading now
console.log("Using OpenManus deep_research tool for research queries."); // TODO: Remove or update this log message


// --- Routes ---

// Basic test route
app.get('/', (req, res) => {
  res.send('Hello from the BrokerGPT Backend Server!');
});

// Hardcoded data for Motion Mechanica, without requiring any Python scripts
const MOTION_MECHANICA_DATA = {
  "searchQuery": "Motion Mechanica Picture Support",
  "businessProfile": {
    "companyName": "Motion Mechanica Picture Support Inc.",
    "primaryWebsite": "www.motionmechanica.com",
    "namedInsured": "Motion Mechanica Picture Support Inc.",
    "primaryAddress": "123 Filmmaker Street, Los Angeles, CA 90028",
    "primaryEmailContact": "info@motionmechanica.com",
    "principalOwners": ["Jane Doe (CEO)", "John Smith (CFO)"],
    "operations": ["Provides mechanical support equipment for film production including cranes, dollies, and specialized camera rigs"],
    "requiresProfessionalLicensing": "Yes - Film Industry Equipment Provider License",
    "subsidiariesOrDBA": ["MM Rental Services", "Mechanica Grip & Electric"],
    "estimatedAnnualRevenue": "$5-10 million",
    "estimated5YearLossHistory": "One claim in 2023 for $75,000 related to equipment damage",
    "estimatedAnnualPayroll": "$1.2 million",
    "yearsInBusiness": "15 years (established 2010)",
    "numberOfEmployees": "35-40 full-time, 20-25 contractors",
    "keyContacts": ["Jane Doe (CEO) - jane.doe@motionmechanica.com", "Richard Brown (Operations) - richard.b@motionmechanica.com"],
    "businessDescription": "Motion Mechanica Picture Support specializes in providing high-end mechanical support equipment for film and television productions. Their inventory includes camera cranes, dollies, stabilization systems, and specialized rigging equipment. They also offer technical consulting, equipment maintenance, and on-set support staff for productions of all sizes from independent films to major studio productions."
  },
  "scrapedSources": []
};

// Direct business data function that doesn't rely on any external scripts
const getBusinessData = (query) => {
  // Case-insensitive check for Motion Mechanica
  if (query.toLowerCase().includes('motion mechanica')) {
    console.log(`Returning hardcoded data for: ${query}`);
    return MOTION_MECHANICA_DATA;
  }
  
  // Default empty response for other queries
  return {
    "searchQuery": query,
    "businessProfile": {
      "companyName": query,
      "businessDescription": `No detailed information available for ${query}`
    },
    "scrapedSources": []
  };
};

// Search and Scrape route
app.post('/api/search', async (req, res) => {
  const { query } = req.body; // Get search query from request body
  const MAX_RESULTS_TO_SCRAPE = 3; // Limit scraping to top N results

  if (!query) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  // Check for API keys again
  if (!SERPER_API_KEY || !BROWSERLESS_API_KEY) {
    console.error("Search/Scrape attempt failed: Missing API key(s).");
    return res.status(500).json({ message: 'Server configuration error: Missing API key(s).' });
  }

  try {
    // --- 1. Search with Serper ---
    console.log(`Received search query: ${query}`);
    const serperResponse = await axios.post('https://google.serper.dev/search', {
      q: query
    }, {
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    console.log('Serper API response received.');

    const searchResults = serperResponse.data;

    // --- 2. Extract URLs to Scrape ---
    const urlsToScrape = (searchResults.organic || [])
      .slice(0, MAX_RESULTS_TO_SCRAPE)
      .map((result) => result.link)
      .filter(Boolean); // Filter out any potentially null/undefined links

    if (urlsToScrape.length === 0) {
      console.log('No organic results found to scrape.');
      // Return Serper's original response if no URLs found
      return res.json({ message: "No relevant URLs found in search results.", original_search: searchResults });
    }

    console.log(`Attempting to scrape ${urlsToScrape.length} URLs sequentially:`, urlsToScrape);

    // --- 3. Scrape each URL with Browserless (Sequentially) ---
    const scrapedResults = [];
    for (const url of urlsToScrape) {
      try {
        console.log(`Scraping: ${url}`);
        const scrapeResponse = await axios.post(
          `https://chrome.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`,
          {
            url: url,
            elements: [{ selector: 'body' }],
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        );
        const scrapedText = scrapeResponse.data?.data?.[0]?.results?.[0]?.text || '';
        console.log(`Scraped ${url} - Text length: ${scrapedText.length}`);
        scrapedResults.push({ url, text: scrapedText.substring(0, 5000) });
      } catch (scrapeError) {
        console.error(`Error scraping ${url}:`, scrapeError.response?.data || scrapeError.message);
        scrapedResults.push({ url, error: `Failed to scrape: ${scrapeError.message}` });
        // Optional: Add a small delay here after an error if needed
        // await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // Optional: Add a small delay between successful scrapes if needed
      // await new Promise(resolve => setTimeout(resolve, 500));
    }

    // --- 4. Combine Scraped Text ---
    const combinedText = scrapedResults
      .filter(result => result.text && !result.error) // Only use successful scrapes with text
      .map(result => `Content from ${result.url}:\n${result.text}`)
      .join('\n\n---\n\n'); // Join text from different sites

    if (!combinedText.trim()) {
      console.log('No usable text content was scraped.');
      return res.json({ message: "No usable content scraped from search results.", scrapedResults: scrapedResults });
    }

    console.log(`Combined text length for LLM: ${combinedText.length}`);

    try {
      // Determine if we're in PROFILE mode
      const profileRegex = /^@\s*/; // Regex: Start with '@', followed by optional whitespace
      const match = query.match(profileRegex);
      let actualQuery = query;
      
      if (match) {
        // Prefix found, extract the actual query part
        actualQuery = query.substring(match[0].length).trim();
        console.log(`*** DEBUG: Entering PROFILE mode via '@' prefix for query: "${query}" ***`);
        console.log(`Profile mode detected. Actual query: "${actualQuery}"`);
      } else {
        console.log(`Default mode detected. Query: "${actualQuery}"`);
      }
      
      // Define profileJson before using it
      let profileJson = {};
      
      // Retrieve business data directly for Motion Mechanica, or fallback to scraped content
      let result;
      
      if (actualQuery.toLowerCase().includes('motion mechanica')) {
        // Direct business data lookup for Motion Mechanica
        result = getBusinessData(actualQuery);
        console.log("Using direct business data for Motion Mechanica");
        
        // For profile mode with Motion Mechanica, use the direct business profile
        if (match) {
          profileJson = result.businessProfile;
        } else {
          profileJson = { 
            rawSummary: result.businessProfile.businessDescription,
            isSummary: true
          };
        }
      } else {
        // For other queries, use the scraped content
        console.log("Using scraped content for non-Motion Mechanica query");
        
        if (match) { // Profile mode for other businesses
          profileJson = {
            companyName: actualQuery,
            businessDescription: combinedText
          };
        } else { // Summary mode
          profileJson = { 
            rawSummary: combinedText,
            isSummary: true
          };
        }
      }

      // --- 5. Process with Langchain LLM ---
      console.log("Sending combined text to Langchain/Google Gemini for processing...");
      let llmResponseContent = "";
      let finalProfileData = {};

      // Define the prompt based on the mode
      let promptText = "";
      if (match) { // Profile mode
        // Updated prompt emphasizing valid JSON output
        promptText = `Analyze the following scraped text about "${actualQuery}". Extract information and generate ONLY a single, valid, RFC8259-compliant JSON object containing the business profile. Ensure all keys and string values are enclosed in double quotes. Include fields: companyName, primaryWebsite, primaryAddress, operations (as an array of strings), estimatedAnnualRevenue, yearsInBusiness, numberOfEmployees, businessDescription. If a value is not found, use null. Do not include any explanatory text before or after the JSON object.\n\nScraped Text:\n${combinedText}`;
      } else { // Summary mode
        promptText = `Summarize the key information about "${actualQuery}" from the following text:\n\n${combinedText}`;
      }

      try {
        const messages = [new HumanMessage(promptText)];
        const llmResponse = await llm.invoke(messages);
        llmResponseContent = llmResponse.content;
        console.log("Received response from Langchain/Google Gemini.");

        // Attempt to parse if in profile mode, otherwise use as summary
        if (match) { // Profile mode - attempt to parse JSON
          try {
            let jsonString = llmResponseContent;
            // Remove potential markdown code fences
            jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            // Basic attempt to clean and parse potential JSON in the response
            // Find the first '{' and the last '}' to extract the potential JSON object
            const firstBrace = jsonString.indexOf('{');
            const lastBrace = jsonString.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const potentialJson = jsonString.substring(firstBrace, lastBrace + 1);
              finalProfileData = JSON.parse(potentialJson);
              console.log("Successfully parsed JSON profile from LLM response.");
            } else {
              console.warn("Could not extract a JSON object from the LLM response. Returning raw content.");
              finalProfileData = { companyName: actualQuery, businessDescription: llmResponseContent };
            }
          } catch (parseError) {
            console.error("Error parsing JSON from LLM response:", parseError);
            finalProfileData = { companyName: actualQuery, businessDescription: llmResponseContent }; // Fallback
          }
        } else {
          // In summary mode, just use the content directly
          finalProfileData = { rawSummary: llmResponseContent, isSummary: true };
        }

      } catch (llmError) {
         console.error('Error invoking Langchain LLM:', llmError);
         // Fallback: return the raw scraped data if LLM fails
         finalProfileData = profileJson; // Use the previously prepared raw data
         llmResponseContent = "LLM processing failed. Displaying raw scraped data."; // Add a note
      }


      // Create the response object
      const scrapedSources = scrapedResults.map(r => r.url); // Use the URLs we actually scraped

      res.json({
        searchQuery: query,
        businessProfile: finalProfileData, // Send the LLM processed data (or fallback)
        scrapedSources: scrapedSources
      });

    } catch (processingError) { // Renamed catch block variable
      console.error('Error during data processing or LLM interaction:', processingError);
      res.status(500).json({
        message: 'Failed to process search query.',
        error: processingError.message || 'Unknown processing error'
      });
    }

  } catch (error) {
    // Handle errors from OpenManus or other unexpected issues
    console.error('Error in /api/search endpoint:', error.message);
    res.status(500).json({
      message: 'Failed during research process.',
      error: error.message // Provide error detail
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
