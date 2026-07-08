export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="d-flex align-items-center gap-2 py-4 text-secondary">
      <div className="spinner-border spinner-border-sm text-primary" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
      <span>{label}</span>
    </div>
  );
}
