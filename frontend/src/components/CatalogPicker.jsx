import { useMemo, useState } from 'react';
import { CATALOG, MAKES } from '../data/vehicleCatalog';

const BODY_LABELS = {
  coupe: 'Coupe', fastback: 'Fastback', midengine: 'Mid-engine', sedan: 'Sedan',
  hatch: 'Hatchback', suv: 'SUV', pickup: 'Truck', roadster: 'Roadster',
};

export default function CatalogPicker({ onSelect }) {
  const [query, setQuery] = useState('');
  const [make, setMake] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((c) => {
      if (make && c.make !== make) return false;
      if (!q) return true;
      return `${c.make} ${c.model} ${c.years} ${BODY_LABELS[c.body]}`.toLowerCase().includes(q);
    });
  }, [query, make]);

  return (
    <div className="model-library">
      <input
        type="text"
        className="library-search"
        placeholder="Search make, model, year…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="make-chips">
        <button type="button" className={`chip${!make ? ' selected' : ''}`} onClick={() => setMake('')}>All</button>
        {MAKES.map((m) => (
          <button key={m} type="button" className={`chip${make === m ? ' selected' : ''}`} onClick={() => setMake(m === make ? '' : m)}>
            {m}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="muted-line small">No vehicles match that search.</p>
      ) : (
        <div className="library-grid catalog-grid">
          {filtered.map((c) => (
            <button type="button" key={c.id} className="library-card" onClick={() => onSelect(c)}>
              <span className="catalog-make">{c.make}</span>
              <span className="catalog-model">{c.model}</span>
              <span className="muted-line small">{c.years} · {BODY_LABELS[c.body]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
