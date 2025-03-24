import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Smile, Send, Loader2 } from 'lucide-react';
import SuggestionCard from './SuggestionCard';
import ChatMessage from './ChatMessage';
import NewChatButton from './NewChatButton';
import { ChatMessage as ChatMessageType } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  clientId?: number;
  onCreateProfile?: () => void;
}

export default function ChatInterface({ messages, clientId, onCreateProfile }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Sample suggestion prompts
  const suggestions = [
    "Create profile for Acme Widgets, Vancouver, Canada.",
    "When does ABC Restaurant's current policy expire?",
    "Make a list of all policies bound in Kelowna, BC."
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const messageData = {
        role: 'user',
        content: message,
        clientId
      };
      
      const response = await apiRequest('POST', '/api/chat', messageData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the chat query to refetch messages
      queryClient.invalidateQueries({ queryKey: clientId ? [`/api/chat/${clientId}`] : ['/api/chat'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      console.error('Error sending message:', error);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    sendMessageMutation.mutate(inputValue);
    setInputValue('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessageMutation.mutate(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    // Clear the messages (this would be handled by the parent component)
    queryClient.setQueryData(clientId ? [`/api/chat/${clientId}`] : ['/api/chat'], []);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4 flex flex-col">
      <div className="max-w-3xl mx-auto w-full space-y-8 flex-grow">
        
        {/* Messages or Suggestions if no messages */}
        {messages.length === 0 ? (
          <>
            {/* Agent Profile - Only show when no messages */}
            <div className="flex flex-col items-center mb-8 mt-4">
              <Avatar className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-gray-200">
                <AvatarImage src="/brokergpt-logo.svg" alt="BrokerGPT logo" />
                <AvatarFallback>BG</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold text-gray-900">BrokerGPT Agent</h1>
            </div>
            
            {/* Suggestion cards - Only show when no messages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestions.map((text, index) => (
                <SuggestionCard 
                  key={index} 
                  text={text} 
                  onClick={() => handleSuggestionClick(text)} 
                />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="mt-auto">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about a new or existing client"
              className="w-full p-3 pr-16 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
              disabled={sendMessageMutation.isPending}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-gray-700"
                aria-label="Add emoji"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                variant="default" 
                size="icon"
                className="rounded-full bg-black text-white h-8 w-8"
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !inputValue.trim()}
                aria-label="Send message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <NewChatButton onClick={handleNewChat} />
        </div>
      </div>
    </div>
  );
}
