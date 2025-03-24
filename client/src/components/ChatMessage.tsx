import { ChatMessage as ChatMessageType } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Partial<ChatMessageType>;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex items-start gap-3 my-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className={cn(
        "h-8 w-8",
        isUser ? "bg-blue-600" : "bg-gray-500"
      )}>
        {!isUser && <AvatarImage src="/brokergpt-logo.svg" alt="BrokerGPT" />}
        <AvatarFallback>
          {isUser ? 'U' : 'B'}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "rounded-lg py-2 px-4 max-w-[80%]",
        isUser 
          ? "bg-blue-600 text-white rounded-tr-none" 
          : "bg-gray-100 text-gray-900 rounded-tl-none"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
