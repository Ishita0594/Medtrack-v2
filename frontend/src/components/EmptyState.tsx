export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="empty-state text-center py-5">
      <div className="empty-state-icon mx-auto mb-3">+</div>
      <h2 className="h5">{title}</h2>
      <p className="text-secondary mb-0">{message}</p>
    </div>
  );
}
