import type { FilterState } from '@/lib/filters';
import { EMPTY_FILTER_STATE } from '@/lib/filters';

export default function FilterPanel({
  state,
  onChange,
  showDelivery = true,
  showMembers = false,
  showTotalArea = false,
  onApply,
  onReset,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  showDelivery?: boolean;
  showMembers?: boolean;
  showTotalArea?: boolean;
  onApply?: () => void;
  onReset?: () => void;
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...state, ...patch });

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Filters</h3>
      <div className="grid-2 gap-md">
        <div>
          <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Min distance (km)
          </label>
          <input
            className="input"
            type="number"
            min={0}
            value={state.minDistance ?? ''}
            onChange={(e) =>
              set({ minDistance: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div>
          <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Max distance (km)
          </label>
          <input
            className="input"
            type="number"
            min={0}
            value={state.maxDistance ?? ''}
            onChange={(e) =>
              set({ maxDistance: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div>
          <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Min price (₹)
          </label>
          <input
            className="input"
            type="number"
            min={0}
            value={state.minPrice ?? ''}
            onChange={(e) =>
              set({ minPrice: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div>
          <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Max price (₹)
          </label>
          <input
            className="input"
            type="number"
            min={0}
            value={state.maxPrice ?? ''}
            onChange={(e) =>
              set({ maxPrice: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
      </div>

      {showDelivery && (
        <div style={{ marginTop: 12 }}>
          <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            Home delivery
          </label>
          <div className="flex gap-sm">
            {(['any', 'yes', 'no'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`chip ${state.homeDelivery === v ? 'chip--active' : ''}`}
                onClick={() => set({ homeDelivery: v })}
              >
                {v === 'any' ? 'Any' : v === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
      )}

      {showMembers && (
        <div className="grid-2 gap-md" style={{ marginTop: 12 }}>
          <div>
            <label className="text-secondary" style={{ fontSize: 12 }}>Min members</label>
            <input
              className="input"
              type="number"
              value={state.minMembers ?? ''}
              onChange={(e) =>
                set({ minMembers: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="text-secondary" style={{ fontSize: 12 }}>Max members</label>
            <input
              className="input"
              type="number"
              value={state.maxMembers ?? ''}
              onChange={(e) =>
                set({ maxMembers: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </div>
      )}

      {showTotalArea && (
        <div className="grid-2 gap-md" style={{ marginTop: 12 }}>
          <div>
            <label className="text-secondary" style={{ fontSize: 12 }}>Min area</label>
            <input
              className="input"
              type="number"
              value={state.minTotalArea ?? ''}
              onChange={(e) =>
                set({ minTotalArea: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="text-secondary" style={{ fontSize: 12 }}>Max area</label>
            <input
              className="input"
              type="number"
              value={state.maxTotalArea ?? ''}
              onChange={(e) =>
                set({ maxTotalArea: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </div>
      )}

      <div className="flex gap-md mt-lg">
        <button
          type="button"
          className="btn btn-secondary flex-1"
          style={{ flex: 1 }}
          onClick={() => {
            onChange({ ...EMPTY_FILTER_STATE });
            onReset?.();
          }}
        >
          Reset
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={onApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
