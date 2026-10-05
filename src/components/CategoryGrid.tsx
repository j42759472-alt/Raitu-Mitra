import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HomeCatalogItem } from '@/lib/homeCatalog';
import { safeIcon } from '@/lib/homeCatalog';

function CatalogIcon({ name }: { name: string }) {
  const iconName = safeIcon(name);
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const Icon = icons[iconName] ?? LucideIcons.Leaf;
  return <Icon size={22} color="#2E7D32" />;
}

function routeForItem(item: HomeCatalogItem): string {
  const r = item.route;
  if (r.kind === 'category') {
    const params = new URLSearchParams();
    params.set('section', r.section);
    if (r.subcategory) params.set('sub', r.subcategory);
    return `/category?${params.toString()}`;
  }
  if (r.kind === 'workforce') {
    const params = new URLSearchParams();
    if (r.workerType) params.set('type', r.workerType);
    return `/workforce?${params.toString()}`;
  }
  if (r.kind === 'more') return `/more/${r.sectionId}`;
  if (r.kind === 'schemes') return '/schemes';
  if (r.kind === 'screen') return r.href;
  return '/';
}

export default function CategoryGrid({ items }: { items: HomeCatalogItem[] }) {
  return (
    <div className="grid-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to={routeForItem(item)}
          className="card"
          style={{
            padding: 12,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            minHeight: 100,
          }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CatalogIcon name={item.icon} />
            </div>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
