import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import SearchBar from '@/components/SearchBar';
import ChatInterface from '@/components/ChatInterface';
import Pagination from '@/components/Pagination';
import { fetchChatMessages } from '@/lib/api';
import { ChatMessage } from '@shared/schema';

export default function ChatPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentClientId, setCurrentClientId] = useState<number | undefined>(undefined);
  const queryClient = useQueryClient();
  
  // Number of messages to show per page
  const messagesPerPage = 50;
  
  // Fetch chat messages
  const { data: allMessages = [], isLoading, error } = useQuery({
    queryKey: currentClientId ? [`/api/chat/${currentClientId}`] : ['/api/chat'],
    queryFn: () => fetchChatMessages(currentClientId),
  });
  
  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(allMessages.length / messagesPerPage));
  
  // Get current page messages
  const getCurrentPageMessages = (): ChatMessage[] => {
    if (allMessages.length === 0) return [];
    
    const startIndex = (currentPage - 1) * messagesPerPage;
    return allMessages.slice(startIndex, startIndex + messagesPerPage);
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleCreateProfile = () => {
    // This would open the profile creation dialog
    // which is implemented in SearchBar component
  };
  
  // Reset to page 1 when messages change
  useEffect(() => {
    setCurrentPage(1);
  }, [allMessages.length]);
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <SearchBar />
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-500">Error loading messages</div>
          </div>
        ) : (
          <ChatInterface
            messages={getCurrentPageMessages()}
            clientId={currentClientId}
            onCreateProfile={handleCreateProfile}
          />
        )}
        
        {/* Pagination removed as per design requirements */}
      </main>
    </div>
  );
}
