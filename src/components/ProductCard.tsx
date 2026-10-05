import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/products';

export default function ProductCard({ product }: { product: MarketplaceProduct }) {
  const href =
    product.genericType === 'worker'
      ? `/worker/${product.id}`
      : `/listing/${product.id}`;

  return (
    <Link to={href} className="card" style={{ overflow: 'hidden', display: 'block' }}>
      <div
        style={{
          height: 140,
          background: product.imageUri
            ? `url(${product.imageUri}) center/cover`
            : '#F8F9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7A867A',
          fontSize: 13,
        }}
      >
        {!product.imageUri && (product.genericType === 'worker' ? '👷' : '🌾')}
      </div>
      <div style={{ padding: 12 }}>
        <h3
          style={{
            margin: '0 0 4px',
            fontSize: 14,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.title}
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#2E7D32' }}>
          {product.qty.priceText || `₹${product.price.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-sm text-secondary" style={{ fontSize: 12 }}>
          <MapPin size={12} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.location || 'Location N/A'}
          </span>
        </div>
        {product.rating > 0 && (
          <div className="flex items-center gap-sm mt-md" style={{ fontSize: 12 }}>
            <Star size={12} fill="#FFC107" color="#FFC107" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-muted">({product.reviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
