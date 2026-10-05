import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { getMarketplaceProductById } from '@/lib/products';
import { useStore } from '@/store/useStore';
import { checkAndBlockWalletRestricted } from '@/lib/wallet';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [worker, setWorker] = useState<Awaited<ReturnType<typeof getMarketplaceProductById>>>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!id) return;
    getMarketplaceProductById(id).then(setWorker).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!worker) {
    return (
      <div>
        <PageHeader title="Not found" />
        <p className="page text-center text-secondary">Worker not found</p>
      </div>
    );
  }

  const hire = async () => {
    if (!user?.full_name) return;
    const blocked = await checkAndBlockWalletRestricted(
      user.full_name,
      user.id,
      () => navigate('/payments'),
    );
    if (blocked) return;

    const days = Math.max(
      1,
      Math.ceil(
        (Date.parse(endDate) - Date.parse(startDate)) / (24 * 60 * 60 * 1000) + 1,
      ),
    );
    const params = new URLSearchParams({
      mode: 'hire',
      productId: worker.id,
      productTitle: worker.title,
      sellerName: worker.sellerName,
      sellerId: worker.sellerId ?? '',
      category: worker.category,
      quantity: qty,
      unit: worker.unit,
      unitPrice: String(worker.price),
      buyerName: user.full_name,
      buyerId: user.id,
      buyerLocation: user.village ?? '',
      workerLocation: worker.location,
      startDate,
      endDate,
      totalDays: String(days),
      isGroup: worker.isGroup ? '1' : '0',
    });
    navigate(`/order/confirm?${params}`);
  };

  return (
    <div>
      <PageHeader title={worker.title} subtitle={worker.sellerName} />
      <div className="page" style={{ maxWidth: 640 }}>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#2E7D32' }}>
          {worker.qty.priceText}
        </p>
        <div className="flex items-center gap-sm text-secondary mb-md">
          <MapPin size={16} />
          {worker.location}
        </div>
        {worker.rating > 0 && (
          <div className="flex items-center gap-sm mb-md">
            <Star size={16} fill="#FFC107" color="#FFC107" />
            {worker.rating.toFixed(1)}
          </div>
        )}
        {worker.skills.length > 0 && (
          <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
            {worker.skills.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        )}
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5 }}>
          {worker.description}
        </pre>

        <div className="mt-lg">
          <label className="text-secondary" style={{ fontSize: 13 }}>Workers to hire</label>
          <input className="input mb-md" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          <label className="text-secondary" style={{ fontSize: 13 }}>Start date</label>
          <input className="input mb-md" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label className="text-secondary" style={{ fontSize: 13 }}>End date</label>
          <input className="input mb-md" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button type="button" className="btn btn-primary w-full mt-lg" onClick={hire}>
          Hire Worker{worker.isGroup ? ' Group' : ''}
        </button>
      </div>
    </div>
  );
}
