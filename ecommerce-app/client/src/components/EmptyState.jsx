/** Friendly placeholder for a screen with nothing to show. */
export default function EmptyState({ icon = '∅', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}
