import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1);

  return (
    <div className="bg-white border-t border-gray-200 p-2 flex justify-center">
      <div className="flex items-center space-x-1">
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className={currentPage === page ? "bg-blue-900" : "text-gray-700 hover:bg-gray-100"}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {totalPages > 3 && (
          <Button variant="outline" className="text-gray-700 hover:bg-gray-100" onClick={() => onPageChange(currentPage + 1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
