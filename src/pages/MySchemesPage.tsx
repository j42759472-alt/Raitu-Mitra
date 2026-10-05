import { useEffect, useState } from 'react';
import { loadAppliedSchemes, type AppliedSchemeRow } from '@/lib/mySchemes';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function MySchemesPage() {
  const [schemes, setSchemes] = useState<AppliedSchemeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppliedSchemes().then(setSchemes).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="My Schemes" />
      <div className="page">
        {schemes.length === 0 ? (
          <EmptyState title="No applied schemes" message="Browse schemes and apply from the Schemes page" />
        ) : (
          schemes.map((s) => (
            <div key={`${s.name}-${s.date}`} className="card mb-md" style={{ padding: 16 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{s.name}</h3>
              <p className="text-secondary" style={{ margin: '0 0 8px', fontSize: 13 }}>{s.category}</p>
              <div className="flex justify-between">
                <span className="chip chip--active">{s.status}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{s.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
