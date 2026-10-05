export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page text-center" style={{ paddingTop: 80 }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #E6EEE6',
          borderTopColor: '#2E7D32',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p className="text-secondary">{label}</p>
    </div>
  );
}
