interface PaginationProps {
  page: number;
  hasMore: boolean;
  total?: number | null;
  onFirstPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function Pagination({
  page,
  hasMore,
  total,
  onFirstPage,
  onPrevPage,
  onNextPage,
}: PaginationProps) {
  return (
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      {total != null && (
        <span className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
          {total.toLocaleString()} total
        </span>
      )}
      <button
        onClick={onFirstPage}
        disabled={page === 0}
        className="rounded-lg border border-black/[.08] px-2 py-1.5 text-sm disabled:opacity-30 sm:px-3 dark:border-white/[.145]"
      >
        First
      </button>
      <button
        onClick={onPrevPage}
        disabled={page === 0}
        className="rounded-lg border border-black/[.08] px-2 py-1.5 text-sm disabled:opacity-30 sm:px-3 dark:border-white/[.145]"
      >
        Prev
      </button>
      <span className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
        Page {page + 1}
      </span>
      <button
        onClick={onNextPage}
        disabled={!hasMore}
        className="rounded-lg border border-black/[.08] px-2 py-1.5 text-sm disabled:opacity-30 sm:px-3 dark:border-white/[.145]"
      >
        Next
      </button>
    </div>
  );
}
