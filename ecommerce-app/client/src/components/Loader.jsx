/** Centred loading indicator used while a screen fetches its data. */
export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="spinner spinner-dark" style={{ margin: '0 auto 12px', width: 26, height: 26 }} />
      <p className="muted">{label}</p>
    </div>
  );
}

/** Grey placeholder cards shown while the catalogue loads. */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="product-card">
          <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: 0 }} />
          <div className="body">
            <div className="skeleton" style={{ height: 10, width: '40%' }} />
            <div className="skeleton" style={{ height: 13, width: '90%' }} />
            <div className="skeleton" style={{ height: 13, width: '65%' }} />
            <div className="skeleton" style={{ height: 18, width: '45%', marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
