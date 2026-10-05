import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function TransportRoutePage() {
  const navigate = useNavigate();
  const { transportRoute, setTransportRoute } = useStore();
  const [pickupAddr, setPickupAddr] = useState(transportRoute?.pickupAddress ?? '');
  const [destAddr, setDestAddr] = useState(transportRoute?.destinationAddress ?? '');
  const [pickupLat, setPickupLat] = useState(String(transportRoute?.pickup.lat ?? ''));
  const [pickupLng, setPickupLng] = useState(String(transportRoute?.pickup.lng ?? ''));
  const [destLat, setDestLat] = useState(String(transportRoute?.destination.lat ?? ''));
  const [destLng, setDestLng] = useState(String(transportRoute?.destination.lng ?? ''));

  const save = () => {
    const pickup = { lat: Number(pickupLat), lng: Number(pickupLng) };
    const destination = { lat: Number(destLat), lng: Number(destLng) };
    if (![pickup.lat, pickup.lng, destination.lat, destination.lng].every(Number.isFinite)) {
      window.alert('Enter valid coordinates');
      return;
    }
    const distanceKm = haversineKm(pickup, destination);
    setTransportRoute({
      pickup,
      destination,
      pickupAddress: pickupAddr,
      destinationAddress: destAddr,
      distanceKm,
    });
    navigate(-1);
  };

  const clear = () => {
    setTransportRoute(null);
    navigate(-1);
  };

  return (
    <div>
      <PageHeader title="Transport Route" />
      <div className="page" style={{ maxWidth: 520 }}>
        <h3 style={{ fontSize: 15 }}>Pickup</h3>
        <input className="input mb-md" placeholder="Pickup address" value={pickupAddr} onChange={(e) => setPickupAddr(e.target.value)} />
        <div className="grid-2 gap-md mb-lg">
          <input className="input" placeholder="Lat" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} />
          <input className="input" placeholder="Lng" value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} />
        </div>

        <h3 style={{ fontSize: 15 }}>Destination</h3>
        <input className="input mb-md" placeholder="Destination address" value={destAddr} onChange={(e) => setDestAddr(e.target.value)} />
        <div className="grid-2 gap-md mb-lg">
          <input className="input" placeholder="Lat" value={destLat} onChange={(e) => setDestLat(e.target.value)} />
          <input className="input" placeholder="Lng" value={destLng} onChange={(e) => setDestLng(e.target.value)} />
        </div>

        <button type="button" className="btn btn-primary w-full mb-md" onClick={save}>
          Save Route
        </button>
        <button type="button" className="btn btn-secondary w-full" onClick={clear}>
          Clear Route
        </button>
      </div>
    </div>
  );
}
