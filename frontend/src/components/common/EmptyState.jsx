const EmptyState = ({ icon = "📭", title = "Nothing here", message = "", action = null }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action}
  </div>
);

export default EmptyState;