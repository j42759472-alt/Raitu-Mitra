import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createOrder, orderStatusForCategory } from '@/lib/activity';
import { getMarketplaceProductById } from '@/lib/products';
import { checkWorkerAvailability } from '@/lib/workerAvailability';
import { checkAndBlockWalletRestricted } from '@/lib/wallet';
import {
  calculatePurchaseTotal,
  formatPrice,
  formatQty,
  isConvertible,
  normalizeUnit,
} from '@/lib/units';
import { isTransportExceptTrucks } from '@/lib/purchaseKind';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';

type ConfirmMode = 'buy' | 'book' | 'hire';

function parseNum(value: string | null, fallback = 0): number {
  const n = Number.parseFloat((value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export default function OrderConfirmPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const storeUser = useStore((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = (params.get('mode') as ConfirmMode) || 'buy';
  const productId = params.get('productId') ?? '';
  const productTitle = params.get('productTitle') ?? '';
  const sellerName = params.get('sellerName') ?? '';
  const sellerId = params.get('sellerId') || null;
  const category = params.get('category') ?? '';
  const quantity = parseNum(params.get('quantity'), 1) || 1;
  const isGroupHire = params.get('isGroup') === '1' || quantity > 1;
  const unit = params.get('unit') ?? '';
  const sellerUnit = params.get('sellerUnit') || unit;
  const buyerUnit = params.get('buyerUnit') || unit;
  const unitPrice = parseNum(params.get('unitPrice'), 0);
  const startDate = params.get('startDate') ?? '';
  const endDate = params.get('endDate') ?? '';
  const totalDays = Math.max(1, parseNum(params.get('totalDays'), 1) || 1);
  const numEquipment = Math.max(1, parseNum(params.get('numEquipment'), 1) || 1);
  const isRentalBuy = params.get('isRental') === '1';
  const buyerName = params.get('buyerName') ?? storeUser?.full_name ?? '';
  const buyerId = params.get('buyerId') || storeUser?.id || null;
  const buyerLocation = params.get('buyerLocation') ?? storeUser?.village ?? '';
  const workerLocation = params.get('workerLocation') ?? '';

  const totalPrice = useMemo(() => {
    if (mode === 'hire') return quantity * unitPrice * totalDays;
    return calculatePurchaseTotal({
      pricePerListingUnit: unitPrice,
      buyQty: quantity,
      buyUnit: buyerUnit,
      listingUnit: sellerUnit,
      multiplier: numEquipment,
    });
  }, [mode, quantity, unitPrice, buyerUnit, sellerUnit, totalDays, numEquipment]);

  const confirmLabel =
    mode === 'hire'
      ? isGroupHire
        ? 'Confirm Hire'
        : 'Hire Now'
      : mode === 'book'
        ? 'Confirm Booking'
        : 'Confirm Purchase';

  const onConfirm = async () => {
    if (!productId || !buyerName || !sellerName) {
      window.alert('Order details are incomplete.');
      return;
    }
    if (mode === 'hire' && (!startDate || !endDate)) {
      window.alert('Hire orders require booking dates.');
      return;
    }

    setIsSubmitting(true);
    try {
      const blocked = await checkAndBlockWalletRestricted(
        buyerName,
        buyerId,
        () => navigate('/payments'),
      );
      if (blocked) return;

      if (mode === 'hire' && startDate && endDate) {
        const product = await getMarketplaceProductById(productId);
        const capacityHint = Math.max(
          product?.isGroup ? (product.workerCount || quantity) : 1,
          quantity,
          1,
        );
        const availability = await checkWorkerAvailability({
          workerId: productId,
          fallbackCapacity: capacityHint,
          startDate,
          endDate,
        });
        if (availability.minAvailable < quantity) {
          window.alert(
            `Max ${availability.minAvailable} workers available for these dates.`,
          );
          return;
        }
      }

      const status = mode === 'hire' ? 'PENDING' : orderStatusForCategory(category);
      const cleanName = productTitle
        .replace(/^Hire( Group)?:\s*/i, '')
        .replace(/\s*\(\d+\s*workers?\)\s*$/i, '')
        .trim();
      const hireOrderTitle =
        mode === 'hire'
          ? isGroupHire
            ? `Hire Group: ${cleanName} (${quantity} workers)`
            : `Hire: ${cleanName}`
          : productTitle;

      const orderQuantity =
        mode === 'hire'
          ? quantity
          : isRentalBuy
            ? isTransportExceptTrucks(category)
              ? quantity
              : numEquipment
            : quantity;

      await createOrder({
        productId,
        productTitle: mode === 'hire' ? hireOrderTitle : productTitle,
        buyerName,
        sellerName,
        quantity: orderQuantity,
        buyerUnit: unit || null,
        price: unitPrice,
        totalPrice,
        status,
        buyerLocation,
        buyerId,
        sellerId,
        startDate: mode === 'hire' ? startDate : null,
        endDate: mode === 'hire' ? endDate : null,
      });

      window.alert('Order placed successfully!');
      navigate('/jobs/orders?mode=active');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = [
    { label: 'Item', value: productTitle },
    { label: mode === 'hire' ? 'Worker' : 'Seller', value: sellerName },
    {
      label: 'Quantity',
      value: mode === 'hire' ? `${quantity} worker(s) × ${totalDays} day(s)` : formatQty(quantity),
    },
    {
      label: mode === 'hire' ? 'Wage' : 'Unit Price',
      value: `₹${formatPrice(unitPrice)}${unit ? ` / ${unit}` : ''}`,
    },
    { label: 'Total', value: `₹${formatPrice(totalPrice)}` },
  ];

  return (
    <div>
      <PageHeader title="Confirm Order" />
      <div className="page" style={{ maxWidth: 520 }}>
        <div className="card" style={{ padding: 24, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <h2 style={{ margin: '0 0 4px' }}>Review Your Order</h2>
          <p className="text-secondary">Please review before confirming</p>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between"
              style={{ padding: '8px 0', borderBottom: '1px solid #E6EEE6' }}
            >
              <span className="text-secondary">{row.label}</span>
              <span style={{ fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFF9C4', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
          Once confirmed, this order will appear in My Orders.
        </div>

        <div className="flex gap-md">
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Placing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
