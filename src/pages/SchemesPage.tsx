import { useState } from 'react';
import { saveSchemeApplication } from '@/lib/mySchemes';
import PageHeader from '@/components/PageHeader';

const SCHEMES = [
  {
    name: 'PM-KISAN',
    category: 'Income Support',
    description: '₹6,000 per year direct income support to farmer families in three equal instalments.',
  },
  {
    name: 'PM Fasal Bima Yojana',
    category: 'Crop Insurance',
    description: 'Comprehensive crop insurance scheme covering yield losses due to natural calamities.',
  },
  {
    name: 'Soil Health Card',
    category: 'Farm Inputs',
    description: 'Free soil testing and nutrient recommendations for balanced fertilizer use.',
  },
  {
    name: 'Kisan Credit Card',
    category: 'Credit',
    description: 'Flexible credit for crop production, maintenance, and marketing needs at subsidized rates.',
  },
  {
    name: 'PM-KUSUM',
    category: 'Renewable Energy',
    description: 'Solar pumps and grid-connected solar power plants for farmers.',
  },
  {
    name: 'National Mission on Oilseeds',
    category: 'Oilseeds',
    description: 'Support for oilseed cultivation, processing, and value addition.',
  },
];

export default function SchemesPage() {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  const apply = async (scheme: (typeof SCHEMES)[0]) => {
    setSaving(scheme.name);
    try {
      await saveSchemeApplication({ name: scheme.name, category: scheme.category });
      setApplied((prev) => new Set(prev).add(scheme.name));
      window.alert('Application saved! Track status in My Schemes.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PageHeader title="Government Schemes" />
      <div className="page">
        {SCHEMES.map((scheme) => (
          <div key={scheme.name} className="card mb-md" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{scheme.name}</h3>
            <span className="chip mb-md" style={{ display: 'inline-block', marginBottom: 8 }}>
              {scheme.category}
            </span>
            <p className="text-secondary" style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>
              {scheme.description}
            </p>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={applied.has(scheme.name) || saving === scheme.name}
              onClick={() => apply(scheme)}
            >
              {applied.has(scheme.name) ? 'Applied' : saving === scheme.name ? 'Saving…' : 'Apply / Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
