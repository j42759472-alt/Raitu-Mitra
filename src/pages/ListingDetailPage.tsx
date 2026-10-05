import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { getMarketplaceProductById } from '@/lib/products';
import { useStore } from '@/store/useStore';
import { checkAndBlockWalletRestricted } from '@/lib/wallet';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getMarketplaceProductById>>>(null);
  const [qty, setQty] = useState('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMarketplaceProductById(id).then(setProduct).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!product) {
    return (
      <div>
        <PageHeader title="Not found" />
        <p className="page text-center text-secondary">Listing not found</p>
      </div>
    );
  }

  const isWorker = product.genericType === 'worker';
  const isHire = searchParams.get('mode') === 'hire' || isWorker;
  const mode = isHire ? 'hire' : product.genericType === 'equipment' ? 'book' : 'buy';

  const proceed = async () => {
    if (!user?.full_name) return;
    const blocked = await checkAndBlockWalletRestricted(
      user.full_name,
      user.id,
      () => navigate('/payments'),
    );
    if (blocked) return;

    const params = new URLSearchParams({
      mode,
      productId: product.id,
      productTitle: product.title,
      sellerName: product.sellerName,
      sellerId: product.sellerId ?? '',
      category: product.category,
      quantity: qty,
      unit: product.unit,
      sellerUnit: product.listingUnit ?? product.unit,
      buyerUnit: product.unit,
      unitPrice: String(product.price),
      buyerName: user.full_name,
      buyerId: user.id,
      buyerLocation: user.village ?? user.district ?? '',
    });
    if (isHire) {
      const today = new Date().toISOString().slice(0, 10);
      params.set('startDate', today);
      params.set('endDate', today);
      params.set('totalDays', '1');
    }
    navigate(`/order/confirm?${params}`);
  };

  return (
    <div>
      <PageHeader title={product.title} subtitle={product.sellerName} />
      <div className="page" style={{ maxWidth: 640 }}>
        <div
          className="card mb-lg"
          style={{
            height: 220,
            background: product.imageUri ? `url(${product.imageUri}) center/cover` : '#F8F9FA',
          }}
        />
        <p style={{ fontSize: 24, fontWeight: 700, color: '#2E7D32', margin: '0 0 8px' }}>
          {product.qty.priceText || `₹${product.price.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-sm text-secondary mb-md">
          <MapPin size={16} />
          {product.location || 'Location N/A'}
        </div>
        {product.rating > 0 && (
          <div className="flex items-center gap-sm mb-md">
            <Star size={16} fill="#FFC107" color="#FFC107" />
            {product.rating.toFixed(1)} ({product.reviews} reviews)
          </div>
        )}
        <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{product.description}</p>

        {!isWorker && (
          <div className="mt-lg">
            <label className="text-secondary" style={{ fontSize: 13 }}>Quantity</label>
            <input
              className="input"
              type="number"
              min={product.minOrder}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        )}

        <button type="button" className="btn btn-primary w-full mt-lg" onClick={proceed}>
          {isHire ? 'Hire Now' : mode === 'book' ? 'Book Now' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
