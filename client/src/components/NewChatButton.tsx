import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewChatButtonProps {
  onClick: () => void;
}

export default function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <div className="flex justify-center mt-4">
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full" 
        onClick={onClick}
        aria-label="New Chat"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}
