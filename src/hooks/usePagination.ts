import { useEffect, useMemo, useState } from "react";

export function usePagination<T>(items: T[], initialPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Sempre que o resultado filtrado mudar de tamanho (novo filtro aplicado),
  // volta para a primeira página em vez de deixar o usuário "perdido" numa
  // página que pode não existir mais.
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  // Se a página atual ficar fora do range (ex: pageSize aumentou), volta para a última válida
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    pageCount,
    paginatedItems,
  };
}
