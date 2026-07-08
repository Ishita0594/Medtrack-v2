export function StatCard({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}) {
  return (
    <div className="card stat-card h-100">
      <div className="card-body">
        <div className={`stat-dot bg-${tone}`} />
        <p className="text-secondary small mb-1">{label}</p>
        <strong className="display-6">{value}</strong>
      </div>
    </div>
  );
}
