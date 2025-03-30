import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import './App.css';

// Define message structure
interface Message {
  sender: 'user' | 'bot';
  content: string;
  isError?: boolean; // Optional flag for error messages
}

// Define structure for Serper organic results (adjust as needed based on actual API response)
interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

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
      // --- Call Backend API ---
      const response = await fetch('http://localhost:3001/api/search', { // Assuming backend runs on 3001
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

      const data = await response.json();

      // --- Process and Display Serper Response ---
      let botContent = "No results found."; // Default message

      // Extract and format organic results if they exist
      if (data.organic && Array.isArray(data.organic) && data.organic.length > 0) {
         botContent = data.organic.slice(0, 5).map((result: OrganicResult) => // Limit to top 5 results for brevity
           `Title: ${result.title}\nLink: ${result.link}\nSnippet: ${result.snippet}\n---`
         ).join('\n\n');
      } else if (data.answerBox) {
         // Handle potential answer box if needed
         botContent = `Answer Box: ${data.answerBox.answer || data.answerBox.snippet || 'Content unavailable'}`;
      }
      // Add more processing here if needed for other Serper result types (knowledgeGraph, etc.)

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
