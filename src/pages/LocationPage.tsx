import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { updateUserProfile, toProfileWithRatings } from '@/lib/users';
import PageHeader from '@/components/PageHeader';

// Default Leaflet marker (CDN fallback for Vite)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPage() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [pos, setPos] = useState<{ lat: number; lng: number }>({
    lat: user?.location?.lat ?? 17.385,
    lng: user?.location?.lng ?? 78.4867,
  });
  const [village, setVillage] = useState(user?.village ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const remote = await updateUserProfile(user.id, { village, district });
      const profile = await toProfileWithRatings(remote);
      setUser({ ...profile, location: pos });
      navigate('/');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not save location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Location" />
      <div className="page">
        <div style={{ height: 320, marginBottom: 16, borderRadius: 16, overflow: 'hidden' }}>
          <MapContainer center={[pos.lat, pos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[pos.lat, pos.lng]} />
            <MapClickHandler onPick={(lat, lng) => setPos({ lat, lng })} />
          </MapContainer>
        </div>
        <p className="text-secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Tap the map to set your location · {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
        </p>
        <label className="text-secondary" style={{ fontSize: 13 }}>Village</label>
        <input className="input mb-md" value={village} onChange={(e) => setVillage(e.target.value)} />
        <label className="text-secondary" style={{ fontSize: 13 }}>District</label>
        <input className="input mb-md" value={district} onChange={(e) => setDistrict(e.target.value)} />
        <button type="button" className="btn btn-primary w-full" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Location'}
        </button>
      </div>
    </div>
  );
}
