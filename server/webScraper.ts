import fetch from 'node-fetch';
import { Client as ClientProfile } from '@shared/schema';

// Environment variables for API keys
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

// Serper.dev API endpoint
const SERPER_API_URL = 'https://google.serper.dev/search';

// Browserless.io API endpoint
const BROWSERLESS_API_URL = 'https://chrome.browserless.io/content';

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface CompanyData {
  name: string;
  address?: string;
  email?: string;
  businessType?: string;
  annualRevenue?: number;
  employees?: number;
  riskProfile?: {
    industry?: string;
    hazards?: string[];
    safetyMeasures?: string[];
  };
  [key: string]: any;
}

/**
 * Search for company information using Serper.dev
 * @param companyName The name of the company to search for
 * @returns An array of search results
 */
export async function searchCompany(companyName: string): Promise<SerperResult[]> {
  try {
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY is not set');
    }

    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SERPER_API_KEY,
      },
      body: JSON.stringify({
        q: `${companyName} company information`,
        num: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper.dev API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { organic?: any[] };
    
    if (!data.organic) {
      return [];
    }

    return data.organic.map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
    }));
  } catch (error) {
    console.error('Error searching for company:', error);
    throw error;
  }
}

/**
 * Scrape content from a URL using Browserless.io
 * @param url The URL to scrape
 * @returns The HTML content of the page
 */
export async function scrapeWebsite(url: string): Promise<string> {
  try {
    if (!BROWSERLESS_API_KEY) {
      throw new Error('BROWSERLESS_API_KEY is not set');
    }

    const response = await fetch(`${BROWSERLESS_API_URL}?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        waitFor: 2000, // wait for 2 seconds for JS to load
      }),
    });

    if (!response.ok) {
      throw new Error(`Browserless.io API returned ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error scraping website:', error);
    throw error;
  }
}

/**
 * Extract structured company data from HTML content
 * @param html The HTML content to analyze
 * @param companyName The name of the company to extract data for
 * @returns Structured company data
 */
export function extractCompanyData(html: string, companyName: string): Partial<CompanyData> {
  // This is a simple extraction example - in a real implementation, 
  // you'd use more sophisticated parsing techniques
  const data: Partial<CompanyData> = {
    name: companyName,
  };

  // Extract email addresses using regex
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = html.match(emailRegex);
  if (emails && emails.length > 0) {
    // Filter out common emails that are unlikely to be the company's main contact
    const filteredEmails = emails.filter(email => 
      !email.includes('gmail.com') && 
      !email.includes('yahoo.com') && 
      !email.includes('hotmail.com') &&
      !email.includes('example.com')
    );
    
    if (filteredEmails.length > 0) {
      data.email = filteredEmails[0];
    } else if (emails.length > 0) {
      data.email = emails[0];
    }
  }

  // Extract address - simple example looking for patterns like "Address: ..."
  const addressRegex = /(?:address|location):\s*([^<\n]+)/gi;
  const addressMatch = addressRegex.exec(html);
  if (addressMatch && addressMatch[1]) {
    data.address = addressMatch[1].trim();
  }

  // Extract business type keywords
  const businessTypes = [
    'Restaurant', 'Retail', 'Manufacturing', 'Technology', 
    'Healthcare', 'Construction', 'Finance', 'Education',
    'Professional Services', 'Transportation', 'Real Estate'
  ];
  
  for (const type of businessTypes) {
    const regex = new RegExp(`\\b${type}\\b`, 'i');
    if (regex.test(html)) {
      data.businessType = type;
      break;
    }
  }

  return data;
}

/**
 * Extract risk profile data based on business type
 * @param businessType The type of business
 * @returns Risk profile data
 */
function generateRiskProfile(businessType?: string): CompanyData['riskProfile'] {
  if (!businessType) return undefined;

  const riskProfiles: Record<string, CompanyData['riskProfile']> = {
    'Restaurant': {
      industry: 'Food Service',
      hazards: ['Kitchen Equipment', 'Food Safety', 'Slip and Fall'],
      safetyMeasures: ['Regular Inspections', 'Staff Training']
    },
    'Retail': {
      industry: 'Retail',
      hazards: ['Theft', 'Property Damage', 'Liability Claims'],
      safetyMeasures: ['Security Systems', 'Safety Protocols']
    },
    'Manufacturing': {
      industry: 'Manufacturing',
      hazards: ['Machinery Accidents', 'Chemical Exposure', 'Repetitive Stress'],
      safetyMeasures: ['PPE Requirements', 'Safety Training', 'Regular Maintenance']
    },
    'Technology': {
      industry: 'Technology',
      hazards: ['Cyber Threats', 'Intellectual Property', 'Business Interruption'],
      safetyMeasures: ['Cyber Security', 'Backup Systems', 'IP Protection']
    }
  };

  // Check for exact match
  if (businessType in riskProfiles) {
    return riskProfiles[businessType];
  }

  // Check for partial match
  for (const [type, profile] of Object.entries(riskProfiles)) {
    if (businessType.includes(type)) {
      return profile;
    }
  }

  // No default risk profile if no match found
  return undefined;
}

/**
 * Generate a company profile based on web research
 * @param companyName The name of the company to research
 * @returns A structured company profile
 */
export async function generateCompanyProfile(companyName: string): Promise<Partial<ClientProfile>> {
  try {
    // Step 1: Search for company information
    const searchResults = await searchCompany(companyName);
    
    if (searchResults.length === 0) {
      throw new Error(`No search results found for ${companyName}`);
    }

    // Step 2: Scrape the top search result
    const mainUrl = searchResults[0].link;
    const html = await scrapeWebsite(mainUrl);

    // Step 3: Extract company data from the HTML
    const companyData = extractCompanyData(html, companyName);

    // Step 4: Generate a risk profile based on business type
    if (companyData.businessType) {
      companyData.riskProfile = generateRiskProfile(companyData.businessType);
    }

    // Step 5: We'll only use data we can find through our research
    // No default values will be generated for missing fields
    
    // We won't add default values for annual revenue

    return companyData as Partial<ClientProfile>;
  } catch (error) {
    console.error('Error generating company profile:', error);
    throw error;
  }
}