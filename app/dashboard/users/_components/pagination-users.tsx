"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationUsersProps {
  totalPages: number;
}

export function PaginationUsers({ totalPages }: PaginationUsersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => createPageURL(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      <span className="text-sm font-medium">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => createPageURL(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Siguiente
      </Button>
    </div>
  );
}
