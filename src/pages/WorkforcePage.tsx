import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listWorkerRegistrations } from '@/lib/products';
import { normalizeWorkerCategory } from '@/lib/workerRegistration';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function WorkforcePage() {
  const [params] = useSearchParams();
  const typeFilter = params.get('type') ?? '';
  const navigate = useNavigate();
  const [tab, setTab] = useState<'browse' | 'register'>('browse');
  const [workers, setWorkers] = useState<Awaited<ReturnType<typeof listWorkerRegistrations>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkerRegistrations().then(setWorkers).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!typeFilter) return workers;
    const short = normalizeWorkerCategory(typeFilter);
    return workers.filter((w) => w.category.includes(short) || w.category.includes(typeFilter));
  }, [workers, typeFilter]);

  return (
    <div>
      <PageHeader title="Workforce" subtitle={typeFilter || 'All workers'} />
      <div className="page">
        <div className="flex gap-sm mb-lg">
          <button
            type="button"
            className={`chip ${tab === 'browse' ? 'chip--active' : ''}`}
            onClick={() => setTab('browse')}
          >
            Browse Workers
          </button>
          <button
            type="button"
            className={`chip ${tab === 'register' ? 'chip--active' : ''}`}
            onClick={() => setTab('register')}
          >
            Register
          </button>
        </div>

        {tab === 'register' ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p className="text-secondary mb-md">Register yourself or your worker group</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/workforce/register')}
            >
              Start Registration
            </button>
          </div>
        ) : loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState title="No workers found" />
        ) : (
          <div className="grid-2">
            {filtered.map((w) => (
              <ProductCard key={w.id} product={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
