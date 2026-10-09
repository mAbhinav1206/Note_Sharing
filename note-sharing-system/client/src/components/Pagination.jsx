import Pagination from 'react-bootstrap/Pagination';

/**
 * Pagination - page numbers with first/prev/next/last.
 * `onChange(page)` is called with the new page number.
 */
export default function PageBar({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;

  const items = [];
  const push = (label, target, disabled = false, active = false) =>
    items.push(
      <Pagination.Item key={label} active={active} disabled={disabled} onClick={() => !disabled && onChange(target)}>
        {label}
      </Pagination.Item>
    );

  push('«', 1, page === 1);
  push('‹', page - 1, page === 1);

  // Window of page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) push(p, p, false, p === page);

  push('›', page + 1, page === totalPages);
  push('»', totalPages, page === totalPages);

  return (
    <div className="d-flex flex-column align-items-center gap-1 mt-4">
      <Pagination className="mb-0">{items}</Pagination>
      <small className="text-muted">
        {total} result{total === 1 ? '' : 's'} · page {page} of {totalPages}
      </small>
    </div>
  );
}
