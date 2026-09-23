/**
 * Renders an error from the API, including the field-level list that a 422
 * carries, so a visitor sees every problem at once instead of one per attempt.
 */
export default function Alert({ tone = 'error', message, details = [], onDismiss }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true" style={{ fontWeight: 700 }}>
        {tone === 'error' ? '!' : tone === 'success' ? '✓' : 'i'}
      </span>
      <div style={{ flex: 1 }}>
        <div>{message}</div>
        {details.length > 0 && (
          <ul>
            {details.map((detail, index) => (
              <li key={`${detail.field}-${index}`}>
                <strong>{String(detail.field).replace(/^.*\./, '')}</strong>: {detail.message}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </div>
  );
}
