/**
 * Page selector.
 *
 * Long ranges are condensed with ellipses so the control never grows wider
 * than the viewport on a catalogue with hundreds of pages.
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const windowSize = 1; // pages shown either side of the current one

  for (let i = 1; i <= totalPages; i += 1) {
    const isEdge = i === 1 || i === totalPages;
    const isNear = Math.abs(i - page) <= windowSize;

    if (isEdge || isNear) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <nav className="pagination" aria-label="Catalogue pages">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ‹ Prev
      </button>

      {pages.map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="muted" style={{ padding: '0 4px' }}>…</span>
        ) : (
          <button
            key={entry}
            type="button"
            className={entry === page ? 'current' : ''}
            aria-current={entry === page ? 'page' : undefined}
            onClick={() => onChange(entry)}
          >
            {entry}
          </button>
        )
      )}

      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next ›
      </button>
    </nav>
  );
}
