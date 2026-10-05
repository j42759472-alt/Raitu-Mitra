const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: '#E65100', bg: '#FFFBEB' },
  ACCEPTED: { label: 'Accepted', color: '#43A047', bg: '#E8F5E9' },
  CONFIRMED: { label: 'Confirmed', color: '#43A047', bg: '#E8F5E9' },
  COMPLETED: { label: 'Completed', color: '#1E88E5', bg: '#E3F2FD' },
  CANCELLED: { label: 'Cancelled', color: '#E53935', bg: '#FFEBEE' },
  REJECTED: { label: 'Rejected', color: '#E53935', bg: '#FFEBEE' },
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase();
  const cfg = STATUS_MAP[key] ?? { label: status, color: '#5F6B5F', bg: '#F1F3F5' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {cfg.label}
    </span>
  );
}
