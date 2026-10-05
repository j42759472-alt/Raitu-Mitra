import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMarketplaceProductById, updateMarketplaceProduct } from '@/lib/products';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMarketplaceProductById(id).then((p) => {
      if (p) {
        if (p.sellerName !== user?.full_name && p.sellerId !== user?.id) {
          window.alert('You can only edit your own listings');
          navigate('/jobs/my-jobs');
          return;
        }
        setTitle(p.title);
        setPrice(String(p.price));
        setQty(String(p.availableQuantity));
        setLocation(p.location);
        setDescription(p.description.replace(/\n?\|\|DISABLED\|\|/g, ''));
      }
      setLoading(false);
    });
  }, [id, user?.full_name, user?.id, navigate]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await updateMarketplaceProduct(id, {
        title,
        price: Number(price),
        availableQuantity: Number(qty),
        location,
        description,
      });
      navigate(`/listing/${id}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Edit Listing" />
      <form className="page" style={{ maxWidth: 520 }} onSubmit={save}>
        <label className="text-secondary" style={{ fontSize: 13 }}>Title</label>
        <input className="input mb-md" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label className="text-secondary" style={{ fontSize: 13 }}>Price (₹)</label>
        <input className="input mb-md" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <label className="text-secondary" style={{ fontSize: 13 }}>Available quantity</label>
        <input className="input mb-md" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <label className="text-secondary" style={{ fontSize: 13 }}>Location</label>
        <input className="input mb-md" value={location} onChange={(e) => setLocation(e.target.value)} />
        <label className="text-secondary" style={{ fontSize: 13 }}>Description</label>
        <textarea className="input mb-md" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
