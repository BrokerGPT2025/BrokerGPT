import { ChatMessage } from '@shared/schema';

export const groupMessagesByDate = (messages: ChatMessage[]) => {
  const grouped = new Map<string, ChatMessage[]>();
  
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    const dateString = date.toDateString();
    
    if (!grouped.has(dateString)) {
      grouped.set(dateString, []);
    }
    
    grouped.get(dateString)!.push(message);
  });
  
  return Array.from(grouped.entries()).map(([date, messages]) => ({
    date,
    messages
  }));
};

export const formatTimestamp = (timestamp: Date | string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const extractClientNameFromMessages = (messages: ChatMessage[]): string | null => {
  // Simple regex to find company names - in a real app this would be more sophisticated
  const nameRegex = /\b([A-Z][a-z]+ (?:Inc|LLC|Ltd|Co|Company|Corporation|Industries|Enterprises))\b/g;
  
  for (const message of messages) {
    const match = message.content.match(nameRegex);
    if (match) {
      return match[0];
    }
  }
  
  return null;
};

export const createSystemMessage = (content: string): ChatMessage => {
  return {
    id: 0,
    role: 'system',
    content,
    timestamp: new Date().toISOString(),
  };
};

export const createUserMessage = (content: string, clientId?: number): ChatMessage => {
  return {
    id: 0,
    role: 'user',
    content,
    clientId,
    timestamp: new Date().toISOString(),
  };
};

export const createAssistantMessage = (content: string, clientId?: number): ChatMessage => {
  return {
    id: 0,
    role: 'assistant',
    content,
    clientId,
    timestamp: new Date().toISOString(),
  };
};
