import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listMarketplaceProducts, filterMarketplaceProducts } from '@/lib/products';
import { expandQuery } from '@/lib/searchExpand';
import { cloneFilterState, matchesFilter, type FilterState } from '@/lib/filters';
import FilterPanel from '@/components/FilterPanel';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listMarketplaceProducts>>>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(cloneFilterState());
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    listMarketplaceProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setExpanded([]);
      return;
    }
    expandQuery(query).then(setExpanded);
  }, [query]);

  const filtered = useMemo(() => {
    let items = filterMarketplaceProducts(products, query, [], expanded);
    items = items.filter((item) =>
      matchesFilter(filters, {
        price: item.price,
        itemUnit: item.unit,
        distance: null,
      }),
    );
    return items;
  }, [products, query, expanded, filters]);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <input
        className="input mb-md"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('common.search', 'Search')}
      />
      <button
        type="button"
        className="chip mb-md"
        onClick={() => setShowFilters((v) => !v)}
      >
        {t('common.filter', 'Filter')} {showFilters ? '▲' : '▼'}
      </button>
      {showFilters && (
        <FilterPanel state={filters} onChange={setFilters} onApply={() => setShowFilters(false)} />
      )}
      {filtered.length === 0 ? (
        <EmptyState title={t('common.noResults', 'No results found')} />
      ) : (
        <div className="grid-2">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
