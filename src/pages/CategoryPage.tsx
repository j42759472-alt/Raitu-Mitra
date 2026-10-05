import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listMarketplaceProducts, createMarketplaceProduct } from '@/lib/products';
import { useStore } from '@/store/useStore';
import { checkAndBlockWalletRestricted } from '@/lib/wallet';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function CategoryPage() {
  const [params] = useSearchParams();
  const section = params.get('section') ?? '';
  const sub = params.get('sub') ?? '';
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listMarketplaceProducts>>>([]);
  const [loading, setLoading] = useState(true);
  const [showSell, setShowSell] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [location, setLocation] = useState(user?.village ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listMarketplaceProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const parts = p.category.split('|');
      const sec = parts[0] ?? '';
      const subCat = parts[parts.length - 1] ?? '';
      const sectionMatch = !section || sec.toLowerCase().includes(section.toLowerCase());
      const subMatch = !sub || subCat.toLowerCase().includes(sub.toLowerCase());
      return sectionMatch && subMatch && p.genericType !== 'worker';
    });
  }, [products, section, sub]);

  const categoryPipe = sub ? `${section}|${sub}|${sub}` : `${section}|General|General`;

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.full_name) return;
    const blocked = await checkAndBlockWalletRestricted(
      user.full_name,
      user.id,
      () => navigate('/payments'),
    );
    if (blocked) return;

    setSubmitting(true);
    try {
      await createMarketplaceProduct({
        title,
        price: Number(price),
        category: categoryPipe,
        unit: 'piece',
        location,
        sellerName: user.full_name,
        sellerId: user.id,
        availableQuantity: Number(qty) || 1,
      });
      setShowSell(false);
      const refreshed = await listMarketplaceProducts();
      setProducts(refreshed);
      window.alert('Listing created!');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title={sub || section || 'Category'} subtitle={section} />
      <div className="page">
        <button type="button" className="btn btn-primary w-full mb-lg" onClick={() => setShowSell(true)}>
          + Sell in this category
        </button>
        {filtered.length === 0 ? (
          <EmptyState title="No listings yet" message="Be the first to sell here!" />
        ) : (
          <div className="grid-2">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {showSell && (
        <div className="modal-overlay" onClick={() => setShowSell(false)} role="presentation">
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2 style={{ marginTop: 0 }}>Create Listing</h2>
            <form onSubmit={handleSell}>
              <label className="text-secondary" style={{ fontSize: 13 }}>Title</label>
              <input className="input mb-md" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <label className="text-secondary" style={{ fontSize: 13 }}>Price (₹)</label>
              <input className="input mb-md" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <label className="text-secondary" style={{ fontSize: 13 }}>Quantity</label>
              <input className="input mb-md" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
              <label className="text-secondary" style={{ fontSize: 13 }}>Location</label>
              <input className="input mb-md" value={location} onChange={(e) => setLocation(e.target.value)} />
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}