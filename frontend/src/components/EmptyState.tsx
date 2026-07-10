export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const icon = onAction ? (
    <button
      type="button"
      className="empty-state-icon mx-auto mb-3 border-0 p-0"
      onClick={onAction}
      aria-label={actionLabel ?? title}
    >
      +
    </button>
  ) : (
    <div className="empty-state-icon mx-auto mb-3">+</div>
  );

  return (
    <div className="empty-state text-center py-5">
      {icon}
      <h2 className="h5">{title}</h2>
      <p className="text-secondary mb-0">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
