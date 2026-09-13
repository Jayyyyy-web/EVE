import { useState } from 'react';
import { BUILTIN_MODELS } from '../data/builtinModels';

export default function ModelLibraryPicker({ onSelect }) {
  const [query, setQuery] = useState('');

  const filtered = BUILTIN_MODELS.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="model-library">
      <input
        type="text"
        className="library-search"
        placeholder="Search the model library…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="muted-line small">No models match "{query}".</p>
      ) : (
        <div className="library-grid">
          {filtered.map((m) => (
            <button
              type="button"
              key={m.id}
              className="library-card"
              onClick={() => onSelect(m.path)}
            >
              <div className="library-card-icon">🚗</div>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
