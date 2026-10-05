import { useState } from 'react';
import { openCashfreeCheckout } from '@/lib/cashfree';
import { useStore } from '@/store/useStore';

export default function PayNowModal({
  open,
  onClose,
  onSuccess,
  platformFeeId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  platformFeeId?: string | null;
}) {
  const user = useStore((s) => s.user);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handlePay = async () => {
    const val = Number.parseFloat(amount);
    if (!Number.isFinite(val) || val < 1) {
      setError('Enter a valid amount (minimum ₹1)');
      return;
    }
    if (!user?.full_name) {
      setError('Please sign in first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await openCashfreeCheckout({
        amount: val,
        userName: user.full_name,
        userId: user.id,
        userPhone: user.phone,
        platformFeeId,
        onSuccess: () => {
          onSuccess?.();
          onClose();
          setAmount('');
        },
        onError: (msg) => setError(msg),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Pay Now</h2>
        <p className="text-secondary" style={{ margin: '0 0 16px' }}>
          Pay your platform fee via Cashfree
        </p>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          Amount (₹)
        </label>
        <input
          className="input"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        {error && (
          <p style={{ color: '#E53935', fontSize: 13, marginTop: 8 }}>{error}</p>
        )}
        <div className="flex gap-md mt-lg">
          <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Pay with Cashfree'}
          </button>
        </div>
      </div>
    </div>
  );
}
