import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { disableProduct, enableProduct, listProductsBySeller } from '@/lib/products';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';
import StatusBadge from '@/components/StatusBadge';

export default function MyJobsPage() {
  const user = useStore((s) => s.user);
  const [listings, setListings] = useState<Awaited<ReturnType<typeof listProductsBySeller>>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user?.full_name) return;
    listProductsBySeller(user.full_name).then(setListings).finally(() => setLoading(false));
  };

  useEffect(load, [user?.full_name]);

  const toggle = async (id: string, disabled: boolean) => {
    if (disabled) await enableProduct(id);
    else await disableProduct(id);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="My Jobs" subtitle="Your listings" />
      <div className="page">
        {listings.length === 0 ? (
          <EmptyState title="No listings yet" message="Sell or register as a worker to get started" />
        ) : (
          listings.map((item) => {
            const disabled = item.description.includes('||DISABLED||');
            return (
              <div key={item.id} className="card mb-md" style={{ padding: 16 }}>
                <div className="flex justify-between items-start gap-md">
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{item.title}</h3>
                    <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>
                      ₹{item.price.toLocaleString()} · {item.location}
                    </p>
                    {disabled && <StatusBadge status="CANCELLED" />}
                  </div>
                  <Link to={`/listing/${item.id}/edit`} className="chip">Edit</Link>
                </div>
                <button
                  type="button"
                  className={`btn ${disabled ? 'btn-primary' : 'btn-secondary'} w-full mt-md`}
                  onClick={() => toggle(item.id, disabled)}
                >
                  {disabled ? 'Enable Listing' : 'Disable Listing'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
