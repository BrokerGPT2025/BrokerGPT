import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ChatMessage } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ChatContextType {
  messages: ChatMessage[];
  currentClientId: number | null;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  newChat: () => void;
  setClientId: (id: number | null) => void;
  extractClientProfile: () => Promise<any>;
  recommendCarriers: (clientProfile: any) => Promise<any>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentClientId, setCurrentClientId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch chat messages based on the current client ID
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: currentClientId ? [`/api/chat/${currentClientId}`] : ['/api/chat'],
    enabled: true
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        role: 'user',
        content,
        clientId: currentClientId
      };
      
      const response = await apiRequest('POST', '/api/chat', messageData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the chat query to refetch messages
      queryClient.invalidateQueries({ queryKey: currentClientId ? [`/api/chat/${currentClientId}`] : ['/api/chat'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      console.error('Error sending message:', error);
    }
  });

  const extractProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/extract-profile', {
        messages,
        clientId: currentClientId
      });
      return response.json();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to extract client profile',
        variant: 'destructive',
      });
      console.error('Error extracting profile:', error);
    }
  });

  const recommendCarriersMutation = useMutation({
    mutationFn: async (clientProfile: any) => {
      const response = await apiRequest('POST', '/api/recommend-carriers', {
        clientProfile
      });
      return response.json();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to recommend carriers',
        variant: 'destructive',
      });
      console.error('Error recommending carriers:', error);
    }
  });

  const sendMessage = async (content: string) => {
    await sendMessageMutation.mutateAsync(content);
  };

  const newChat = () => {
    // Clear the current messages
    queryClient.setQueryData(
      currentClientId ? [`/api/chat/${currentClientId}`] : ['/api/chat'],
      []
    );
  };

  const extractClientProfile = async () => {
    return extractProfileMutation.mutateAsync();
  };

  const recommendCarriers = async (clientProfile: any) => {
    return recommendCarriersMutation.mutateAsync(clientProfile);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentClientId,
        isLoading,
        error,
        sendMessage,
        newChat,
        setClientId: setCurrentClientId,
        extractClientProfile,
        recommendCarriers
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
