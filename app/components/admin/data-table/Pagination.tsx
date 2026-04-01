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
    <div className="ml-auto flex items-center gap-3">
      {total != null && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {total.toLocaleString()} total
        </span>
      )}
      <button
        onClick={onFirstPage}
        disabled={page === 0}
        className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm disabled:opacity-30 dark:border-white/[.145]"
      >
        First
      </button>
      <button
        onClick={onPrevPage}
        disabled={page === 0}
        className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm disabled:opacity-30 dark:border-white/[.145]"
      >
        Previous
      </button>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        Page {page + 1}
      </span>
      <button
        onClick={onNextPage}
        disabled={!hasMore}
        className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm disabled:opacity-30 dark:border-white/[.145]"
      >
        Next
      </button>
    </div>
  );
}
