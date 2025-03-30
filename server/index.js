// Import necessary modules
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // We'll use this later for Serper

// Create an Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend requests
app.use(express.json()); // Enable parsing of JSON request bodies

// --- Environment Variables ---
const PORT = process.env.PORT || 3001; // Use port from env or default to 3001
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Basic check for required API key
if (!SERPER_API_KEY) {
  console.error("FATAL ERROR: SERPER_API_KEY is not defined in the environment variables.");
  // In a real app, you might exit or prevent the server from starting fully
  // For now, we'll just log the error. The search endpoint will fail later.
}

// --- Routes ---

// Basic test route
app.get('/', (req, res) => {
  res.send('Hello from the BrokerGPT Backend Server!');
});

// Serper search route
app.post('/api/search', async (req, res) => {
  const { query } = req.body; // Get search query from request body

  if (!query) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  if (!SERPER_API_KEY) {
    // Check again in case the server started despite the initial warning
    console.error("Search attempt failed: SERPER_API_KEY is not defined.");
    return res.status(500).json({ message: 'Server configuration error: Missing API key.' });
  }

  try {
    console.log(`Received search query: ${query}`); // Log the query

    const response = await axios.post('https://google.serper.dev/search', {
      q: query // Serper uses 'q' for the query parameter
    }, {
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Serper API response received.'); // Log success
    res.json(response.data); // Send Serper's response back to the frontend

  } catch (error) {
    console.error('Error calling Serper API:', error.response ? error.response.data : error.message); // Log detailed error
    res.status(error.response?.status || 500).json({
      message: 'Failed to fetch search results from Serper API.',
      error: error.response?.data || error.message // Provide error detail
    });
  }
});


// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
