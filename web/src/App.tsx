import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import './App.css';

// Define message structure
interface Message {
  sender: 'user' | 'bot';
  content: string;
  isError?: boolean; // Optional flag for error messages
}

// Unused interface removed:
// interface OrganicResult {
//   title: string;
//   link: string;
//   snippet: string;
//   position: number;
// }

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

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
    event.preventDefault(); // Prevent default form submission
    const userQuery = inputValue.trim();

    if (!userQuery) return; // Don't send empty messages

    // Add user message to state
    const newUserMessage: Message = { sender: 'user', content: userQuery };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue(''); // Clear input field
    setIsLoading(true); // Show loading indicator

    try {
      // --- Call Backend API using Environment Variable ---
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
      if (!backendUrl) {
        throw new Error("Backend API URL is not configured. Set VITE_BACKEND_API_URL environment variable.");
      }
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!response.ok) {
        // Handle HTTP errors (e.g., 4xx, 5xx)
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // Should contain { searchQuery, businessProfile, scrapedSources }

      // --- Process and Display Gemini Response ---
      let botContent = "Could not generate business profile."; // Default message

      if (data.businessProfile) {
        if (typeof data.businessProfile === 'object' && !data.businessProfile.parseError) {
          // Format the detailed JSON profile for display
          botContent = `Business Profile for "${data.searchQuery}":\n\n`;
          const profile = data.businessProfile; // Alias for easier access

          botContent += `Company Name: ${profile.companyName || 'Not Found'}\n`;
          botContent += `Primary Website: ${profile.primaryWebsite || 'Not Found'}\n`;
          botContent += `Named Insured: ${profile.namedInsured || 'Not Found'}\n`;
          botContent += `Primary Address: ${profile.primaryAddress || 'Not Found'}\n`;
          botContent += `Primary Email: ${profile.primaryEmailContact || 'Not Found'}\n`;
          botContent += `Principal Owners: ${(profile.principalOwners && profile.principalOwners.length > 0) ? profile.principalOwners.join(', ') : 'Not Found'}\n`;
          botContent += `Operations: ${(profile.operations && profile.operations.length > 0) ? profile.operations.join(', ') : 'Not Found'}\n`;
          botContent += `Requires Licensing: ${profile.requiresProfessionalLicensing === null ? 'Not Found' : profile.requiresProfessionalLicensing}\n`; // Handle boolean/null
          botContent += `Subsidiaries/DBA: ${(profile.subsidiariesOrDBA && profile.subsidiariesOrDBA.length > 0) ? profile.subsidiariesOrDBA.join(', ') : 'Not Found'}\n`;
          botContent += `Est. Annual Revenue: ${profile.estimatedAnnualRevenue || 'Not Found'}\n`;
          botContent += `Est. 5yr Loss History: ${profile.estimated5YearLossHistory || 'Not Found'}\n`;
          botContent += `Est. Annual Payroll: ${profile.estimatedAnnualPayroll || 'Not Found'}\n`;
          botContent += `Years in Business: ${profile.yearsInBusiness === null ? 'Not Found' : profile.yearsInBusiness}\n`; // Handle number/null
          botContent += `Number of Employees: ${profile.numberOfEmployees === null ? 'Not Found' : profile.numberOfEmployees}\n`; // Handle number/null

          if (profile.keyContacts && profile.keyContacts.length > 0) {
            botContent += `Key Contacts:\n`;
            profile.keyContacts.forEach((contact: { name: string, title: string }) => {
              botContent += `  - ${contact.name || 'N/A'} (${contact.title || 'N/A'})\n`;
            });
          } else {
             botContent += `Key Contacts: Not Found\n`;
          }

          botContent += `Business Description: ${profile.businessDescription || 'Not Found'}\n`;
          botContent += `Important News: ${(profile.importantNewsArticles && profile.importantNewsArticles.length > 0) ? profile.importantNewsArticles.join(', ') : 'Not Found'}\n`;
          botContent += `Google Street View: ${profile.googleStreetView || 'Not Found'}\n`;
          botContent += `LinkedIn Profile: ${profile.linkedinProfile || 'Not Found'}\n`;
          botContent += `Facebook Profile: ${profile.facebookProfile || 'Not Found'}\n`;
          botContent += `X (Twitter) Profile: ${profile.xProfile || 'Not Found'}\n`;


          // Add sources if available
          if (data.scrapedSources && data.scrapedSources.length > 0) {
             botContent += `\nSources:\n${data.scrapedSources.join('\n')}`;
          }

        } else if (data.businessProfile.rawResponse) {
           // Handle case where JSON parsing failed on backend
           botContent = `LLM response could not be parsed as JSON:\n\n${data.businessProfile.rawResponse}`;
        } else {
           // Handle other unexpected businessProfile content
           botContent = `Received unexpected profile data format.`;
        }
      } else if (data.message) { // Handle cases where backend returns a message (e.g., no usable content scraped)
        botContent = data.message;
      }

      const newBotMessage: Message = { sender: 'bot', content: botContent };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);

    } catch (error: any) {
      console.error("Error fetching search results:", error);
      // Add error message to chat
      const newErrorMessage: Message = {
        sender: 'bot',
        content: `Error: ${error.message || 'Failed to get results'}`,
        isError: true,
      };
      setMessages((prevMessages) => [...prevMessages, newErrorMessage]);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
            {/* Use pre-wrap to preserve line breaks from the formatted response */}
            <pre>{msg.content}</pre>
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
          disabled={isLoading} // Disable input while loading
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
