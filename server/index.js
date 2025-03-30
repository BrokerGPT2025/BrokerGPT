// Import necessary modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import Google AI

// Create an Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend requests
app.use(express.json()); // Enable parsing of JSON request bodies

// --- Environment Variables ---
const PORT = process.env.PORT || 3001;
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Add Google key

// Basic check for required API keys
if (!SERPER_API_KEY || !BROWSERLESS_API_KEY || !GOOGLE_API_KEY) {
  console.error("FATAL ERROR: One or more API keys (SERPER, BROWSERLESS, GOOGLE) are not defined.");
  // In a real app, you might exit or prevent the server from starting fully
}

// --- Initialize Google AI Client ---
let genAI;
let geminiModel;
if (GOOGLE_API_KEY) {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  // Initialize model with JSON mode enabled
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: { responseMimeType: "application/json" } // Enable JSON Mode
  });
  console.log("Google AI Client Initialized with model 'gemini-1.5-flash-latest' in JSON Mode.");
} else {
  console.error("Google AI Client could not be initialized due to missing API key.");
}


// --- Routes ---

// Basic test route
app.get('/', (req, res) => {
  res.send('Hello from the BrokerGPT Backend Server!');
});

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

    // --- 5. Process with Gemini ---
    if (!geminiModel) {
       console.error("Gemini processing skipped: Model not initialized.");
       return res.status(500).json({ message: 'Server configuration error: LLM not available.' });
    }

    // Define the prompt for Gemini
    const prompt = `
      Analyze the following text scraped from websites related to the search query "${query}".
      Extract key business profile information for insurance prospecting.
      Format the output STRICTLY as a valid JSON object with the following fields (use "Not Found" if information is missing). Ensure all key-value pairs are correctly separated by commas:
      - companyName: string
      - websiteUrl: string (the primary website if multiple are mentioned)
      - primaryAddress: string (Street, City, Province/State, Postal Code)
      - mainPhoneNumber: string
      - keyContacts: array of objects [{ name: string, title: string }] (if available)
      - businessDescription: string (brief summary of what the company does)

      Scraped Text:
      ---
      ${combinedText.substring(0, 100000)}
      ---
      VALID JSON Output ONLY:
    `; // Limit input length if necessary for the model

    try {
      console.log("Sending request to Gemini...");
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const profileText = response.text();
      console.log("Gemini response received.");

      // With JSON mode, the response.text() should already be valid JSON string.
      // No need for complex cleaning/fixing logic.
      let profileJson = {};
      try {
        profileJson = JSON.parse(profileText);
        console.log("Successfully parsed Gemini JSON response.");
      } catch (parseError) {
         console.error("Failed to parse JSON response from Gemini even with JSON mode:", parseError);
         console.log("Raw Gemini response:", profileText);
         // Return the raw text if JSON parsing fails (should be less likely now)
         profileJson = { rawResponse: profileText, parseError: "Failed to parse response as JSON." };
      }

      res.json({
          searchQuery: query,
          businessProfile: profileJson, // Send the structured profile
          scrapedSources: scrapedResults.map(r => r.url) // Include sources used
      });

    } catch (llmError) {
      console.error('Error calling Google Gemini API:', llmError);
      res.status(500).json({
        message: 'Failed to process scraped data with LLM.',
        error: llmError.message || 'Unknown LLM error'
      });
    }

  } catch (error) {
    // Handle errors from Serper, Browserless, or other unexpected issues
    console.error('Error in /api/search endpoint:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({
      message: 'Failed during search, scrape, or processing.',
      error: error.response?.data || error.message // Provide error detail
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
