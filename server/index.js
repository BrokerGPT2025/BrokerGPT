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
  // Initialize model WITHOUT default JSON mode
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest"
    // generationConfig: { responseMimeType: "application/json" } // JSON Mode applied conditionally later
  });
  console.log("Google AI Client Initialized with model 'gemini-1.5-flash-latest'.");
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

    // --- 6. Determine Prompt based on Query Prefix ---
    let prompt;
    let actualQuery = query; // Use original query by default
    const profileRegex = /^Profile:\s*/i; // Regex: Start, "Profile:", optional whitespace, case-insensitive

    const match = query.match(profileRegex);
    if (match) {
      // Prefix found, extract the actual query part
      actualQuery = query.substring(match[0].length).trim(); // Get query after the matched prefix part
      console.log(`*** DEBUG: Entering PROFILE mode via REGEX for query: "${query}" ***`); // UPDATED DEBUG LOG
      console.log(`Profile mode detected. Actual query: "${actualQuery}"`);
      // Define the DETAILED PROFILE prompt
      prompt = `
        Analyze the following text scraped from websites related to the search query "${actualQuery}".
        Extract detailed business profile information for insurance prospecting purposes.
        Format the output STRICTLY as a valid JSON object. You MUST include ALL of the following fields in your response.
        Use the JSON value \`null\` (NOT the string "null" or "Not Found") if a value cannot be determined for a specific field.
        Ensure all key-value pairs are correctly formatted and separated by commas:

        {
          "companyName": string,
          "primaryWebsite": string,
          "namedInsured": string,
          "primaryAddress": string, // Street, City, Province/State, Postal Code
          "primaryEmailContact": string,
          "principalOwners": [string],
          "operations": [string], // List of business activities
          "requiresProfessionalLicensing": boolean,
          "subsidiariesOrDBA": [string],
          "estimatedAnnualRevenue": string,
          "estimated5YearLossHistory": string, // Summarize known claims, lawsuits, or public losses
          "estimatedAnnualPayroll": string,
          "yearsInBusiness": number,
          "numberOfEmployees": number,
          "keyContacts": [ { "name": string, "title": string } ],
          "businessDescription": string,
          "importantNewsArticles": [string], // URLs or headlines with source
          "googleStreetView": string, // URL to Google Street View of primary address
          "linkedinProfile": string,
          "facebookProfile": string,
          "xProfile": string // Formerly Twitter
        }

        Scraped Text:
        ---
        ${combinedText.substring(0, 100000)}
        ---

        VALID JSON Output ONLY:
      `;
    } else {
      // Use the DEFAULT prompt (handles other prefixes like "Docs:" implicitly for now)
      console.log(`Default mode detected. Query: "${actualQuery}"`);
      prompt = `
        Analyze the following text scraped from websites, chat logs, and saved documents related to the search query "${actualQuery}".
        Provide a concise summary of the key information found about the subject.

        Scraped Text:
        ---
        ${combinedText.substring(0, 100000)}
        ---

        Summary:
      `;
    }

    // --- 7. Process with Gemini ---
    try {
      let result;
      console.log("Sending request to Gemini with selected prompt...");
      if (match) {
        // Profile mode: Call with JSON generation config
        console.log("...using JSON mode generation config.");
        result = await geminiModel.generateContent(
          prompt,
          { responseMimeType: "application/json" } // Apply JSON mode here
        );
      } else {
        // Default mode: Call without specific generation config
        console.log("...using default text generation config.");
        result = await geminiModel.generateContent(prompt);
      }
      const response = result.response;
      const profileText = response.text();
      console.log("Gemini response received.");

      let profileJson = {}; // Initialize response data object

      if (match) { // Check if we were in Profile mode (match is from the regex check earlier)
        // Clean potential markdown fences from the response
        let cleanedText = profileText.trim();
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.substring(7); // Remove ```json
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.substring(0, cleanedText.length - 3);
        }
        cleanedText = cleanedText.trim(); // Trim again after removing fences

        // Only attempt JSON parse in Profile mode
        try {
          profileJson = JSON.parse(cleanedText); // Parse the cleaned text
          console.log("Successfully parsed Gemini JSON response for Profile mode.");
        } catch (parseError) {
          console.error("Failed to parse JSON response from Gemini even after cleaning:", parseError); // Updated error message
          console.log("Raw Gemini response:", profileText);
          // Keep structure consistent for frontend error handling
          profileJson = { rawResponse: profileText, parseError: "Failed to parse response as JSON." };
        }
      } else {
        // In Default mode, return the raw text within the expected structure
        console.log("Default mode response received (plain text).");
        // Wrap the raw summary text so frontend knows it's not the detailed profile
        profileJson = { rawSummary: profileText, isSummary: true };
      }

      res.json({
          searchQuery: query,
          businessProfile: profileJson, // Send the structured profile (or summary wrapper)
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
