import { Card } from "@/components/ui/card";

interface SuggestionCardProps {
  text: string;
  onClick: () => void;
}

export default function SuggestionCard({ text, onClick }: SuggestionCardProps) {
  return (
    <Card 
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <p className="text-sm text-gray-700">{text}</p>
    </Card>
  );
}
