import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import router components
import './App.css';
import Sidebar from './components/Sidebar'; // Import Sidebar
import MobileNavbar, { MobileMenuPanel } from './components/MobileNavbar'; // Import MobileNavbar and Panel
import StyleGuidePage from './components/StyleGuidePage'; // Import the new style guide component

// Define message structure
interface Message {
  sender: 'user' | 'bot';
  content: string;
  isError?: boolean; // Optional flag for error messages
}

// Helper function to find and linkify URLs in text
// Returns an array of strings and React JSX Elements
const linkifyUrls = (text: string): (string | React.JSX.Element)[] => { // Explicitly use React.JSX.Element
  const urlRegex = /(https?:\/\/[^\s"'>]+)/g; // Regex to find URLs
  const parts = text.split(urlRegex); // Split text by URLs

  return parts.map((part, index) => {
    // Check if the current part is a URL
    if (part && part.match(urlRegex)) {
      // Ensure URL starts with http:// or https:// for safety
      const safeUrl = part.startsWith('http://') || part.startsWith('https://') ? part : `http://${part}`;
      // Return an anchor tag for the URL
      return (
        <a key={index} href={safeUrl} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    // Otherwise, return the text part as is
    return part;
  });
};

// Inline SVG component for the "Open Sidebar" icon
const OpenIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <svg
    width="30px"
    height="30px"
    display="block"
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    viewBox="-2 -3 30 30" /* Reverted to original viewBox */
    xmlSpace="preserve"
    onClick={onClick} // Add onClick handler
    style={{ cursor: 'pointer' }} // Make it look clickable
    className="sidebar-icon-absolute" // Use the class from Webflow CSS
  >
    <style type="text/css">{`.st0{fill:none;stroke:#000000;stroke-width:1.7191;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:5;}`}</style>
    <path className="st0" d="M24,16.01V9.13c0-5.73-2.29-8.02-8.02-8.02H9.1c-5.73,0-8.02,2.29-8.02,8.02v6.88c0,5.73,2.29,8.02,8.02,8.02 h6.88C21.7,24.03,24,21.74,24,16.01z" />
    <path className="st0" d="M7.95,1.11v22.92" />
    {/* Corrected path for the arrow to point right (open) */}
    <path className="st0" d="M13.04,9.64l2.93,2.93l-2.93,2.93" />
  </svg>
);

// Component containing the main chat interface logic (previously the App component)
const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // State for sidebar
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false); // State for mobile menu
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Toggle functions
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages update
  useEffect(scrollToBottom, [messages]);

  // Handle input change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // Handle sending a message
  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userQuery = inputValue.trim();
    if (!userQuery) return;

    const newUserMessage: Message = { sender: 'user', content: userQuery };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // --- Call Backend API using Environment Variable ---
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
      if (!backendUrl) {
        throw new Error("Backend API URL is not configured. Set VITE_BACKEND_API_URL environment variable.");
      }
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let botContent = "Could not generate a response.";

      // --- Process and Display Gemini Response ---
      if (data.businessProfile) {
        // Check if it's the summary response structure
        if (data.businessProfile.isSummary && data.businessProfile.rawSummary) {
          console.log("Frontend received summary response");
          botContent = data.businessProfile.rawSummary;

        // Check if it's the detailed profile structure (and not a parse error)
        } else if (typeof data.businessProfile === 'object' && !data.businessProfile.parseError && !data.businessProfile.isSummary) {
          console.log("Frontend received detailed profile response");
          const profile = data.businessProfile;
          // Format the detailed JSON profile for display
          botContent = `Business Profile for "${data.searchQuery}":\n\n` +
                       `Company Name: ${profile.companyName || 'Not Found'}\n` +
                       `Primary Website: ${profile.primaryWebsite || 'Not Found'}\n` +
                       `Named Insured: ${profile.namedInsured || 'Not Found'}\n` +
                       `Primary Address: ${profile.primaryAddress || 'Not Found'}\n` +
                       `Primary Email: ${profile.primaryEmailContact || 'Not Found'}\n` +
                       `Principal Owners: ${(profile.principalOwners && profile.principalOwners.length > 0) ? profile.principalOwners.join(', ') : 'Not Found'}\n` +
                       `Operations: ${(profile.operations && profile.operations.length > 0) ? profile.operations.join(', ') : 'Not Found'}\n` +
                       `Requires Licensing: ${profile.requiresProfessionalLicensing === null ? 'Not Found' : profile.requiresProfessionalLicensing}\n` +
                       `Subsidiaries/DBA: ${(profile.subsidiariesOrDBA && profile.subsidiariesOrDBA.length > 0) ? profile.subsidiariesOrDBA.join(', ') : 'Not Found'}\n` +
                       `Est. Annual Revenue: ${profile.estimatedAnnualRevenue || 'Not Found'}\n` +
                       `Est. 5yr Loss History: ${profile.estimated5YearLossHistory || 'Not Found'}\n` +
                       `Est. Annual Payroll: ${profile.estimatedAnnualPayroll || 'Not Found'}\n` +
                       `Years in Business: ${profile.yearsInBusiness === null ? 'Not Found' : profile.yearsInBusiness}\n` +
                       `Number of Employees: ${profile.numberOfEmployees === null ? 'Not Found' : profile.numberOfEmployees}\n` +
                       `Key Contacts:\n${(profile.keyContacts && profile.keyContacts.length > 0) ? profile.keyContacts.map((c: { name: string, title: string }) => `  - ${c.name || 'N/A'} (${c.title || 'N/A'})`).join('\n') : '  Not Found'}\n` +
                       `Business Description: ${profile.businessDescription || 'Not Found'}\n` +
                       `Important News: ${(profile.importantNewsArticles && profile.importantNewsArticles.length > 0) ? profile.importantNewsArticles.join(', ') : 'Not Found'}\n` +
                       `Google Street View: ${profile.googleStreetView || 'Not Found'}\n` +
                       `LinkedIn Profile: ${profile.linkedinProfile || 'Not Found'}\n` +
                       `Facebook Profile: ${profile.facebookProfile || 'Not Found'}\n` +
                       `X (Twitter) Profile: ${profile.xProfile || 'Not Found'}\n`;

          // Add sources if available
          if (data.scrapedSources && data.scrapedSources.length > 0) {
             botContent += `\n\nSources:\n${data.scrapedSources.join('\n')}`;
          }
        // Handle case where JSON parsing failed on backend (Profile mode only)
        } else if (data.businessProfile.rawResponse) {
           console.log("Frontend received profile parse error response");
           botContent = `LLM response could not be parsed as JSON:\n\n${data.businessProfile.rawResponse}`;
        // Handle other unexpected businessProfile content
        } else {
           console.log("Frontend received unexpected profile data format", data.businessProfile);
           botContent = `Received unexpected profile data format.`;
        }
      // Handle cases where backend returns a simple message (e.g., no usable content scraped)
      } else if (data.message) {
        console.log("Frontend received simple message response");
        botContent = data.message;
      }

      const newBotMessage: Message = { sender: 'bot', content: botContent };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);

    } catch (error: any) {
      console.error("Error fetching search results:", error);
      const newErrorMessage: Message = {
        sender: 'bot',
        content: `Error: ${error.message || 'Failed to get results'}`,
        isError: true,
      };
      setMessages((prevMessages) => [...prevMessages, newErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  }; // End of handleSendMessage

  // Component Render
  return (
    // Use a main wrapper to handle layout changes based on sidebar state
    // Add 'mobile-menu-active' class when mobile menu is open
    <div className={`app-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>

      {/* Sidebar Component - Rendered on desktop */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Open Sidebar Icon Wrapper - Positioned absolutely */}
      <div className="sidebar-icon-absolute-wrapper">
        {!isSidebarOpen && <OpenIcon onClick={toggleSidebar} />}
      </div>

      {/* Main content area including mobile nav and chat */}
      <div className="main-content-wrapper">

        {/* Mobile Navbar - Rendered based on CSS media queries potentially */}
        <MobileNavbar onMenuToggle={toggleMobileMenu} />

        {/* Mobile Menu Panel - Conditionally rendered based on state */}
        <MobileMenuPanel isOpen={isMobileMenuOpen} />

        {/* Chat Container */}
        <div className="chat-container">
          <div className="messages-area">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                {/* Use pre-wrap for spacing, but process content for links */}
                <pre>{linkifyUrls(msg.content)}</pre>
              </div>
            ))}
            {/* Loading indicator */}
            {isLoading && (
              <div className="message bot loading">
                <span>Thinking...</span>
              </div>
            )}
            {/* Empty div to scroll to */}
            <div ref={messagesEndRef} />
          </div>
          <form className="input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ask me to search..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              Send
            </button>
          </form>
        </div> {/* End chat-container */}

      </div> {/* End main-content-wrapper */}

    </div> // End app-wrapper
  );
}; // End of ChatInterface component


// Main App component now handles routing
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main chat interface route */}
        <Route path="/" element={<ChatInterface />} />

        {/* Conditionally render the style guide route only in development */}
        {import.meta.env.DEV && (
          <Route path="/styleguide" element={<StyleGuidePage />} />
        )}

        {/* Add other routes here as needed */}
        {/* Example: <Route path="/about" element={<AboutPage />} /> */}

        {/* Optional: Add a 404 Not Found route */}
        {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
