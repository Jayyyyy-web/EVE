import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getVehicle, createVehicle, updateVehicle } from '../api/vehicles';
import { uploadModelFile, importModelFromUrl } from '../api/uploads';
import AppLayout from '../components/AppLayout';

const VehicleViewer3D = lazy(() => import('../components/VehicleViewer3D'));

const PAINT_SWATCHES = [
  { name: 'Racing Gray', hex: '#8a8f99' },
  { name: 'Volt Violet', hex: '#7c5cff' },
  { name: 'Signal Amber', hex: '#e0932a' },
  { name: 'Deep Navy', hex: '#1c2540' },
  { name: 'Crimson', hex: '#c23b3b' },
  { name: 'Arctic White', hex: '#f2f4f8' },
];

const WHEEL_OPTIONS = ['Stock', '18" Alloy', '19" Forged (Black)', '20" Chrome'];
const TIRE_OPTIONS = ['All-Season', 'Performance Summer', 'Off-Road', 'Track'];
const SPOILER_OPTIONS = ['None', 'OEM Lip', 'Carbon Fiber Wing', 'Ducktail'];
const EXHAUST_OPTIONS = ['Stock', 'Cat-Back Performance', 'Full Titanium'];
const SUSPENSION_OPTIONS = ['Stock', 'Lowering Springs (-1.5")', 'Coilovers (Adjustable)'];

const emptyForm = {
  name: '',
  model: '',
  color: PAINT_SWATCHES[0].hex,
  wheels: WHEEL_OPTIONS[0],
  tires: TIRE_OPTIONS[0],
  spoiler: SPOILER_OPTIONS[0],
  exhaust: EXHAUST_OPTIONS[0],
  suspension: SUSPENSION_OPTIONS[0],
  interior: 'standard',
  isPublic: false,
  modelUrl: '',
  specs: {
    topSpeedKph: '',
    rangeKm: '',
    batteryKwh: '',
    accel0to100: '',
  },
};

export default function VehicleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('customize');
  const [urlInput, setUrlInput] = useState('');
  const [modelBusy, setModelBusy] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelError, setModelError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getVehicle(id)
      .then((v) =>
        setForm({
          name: v.name || '',
          model: v.model || '',
          color: v.color || PAINT_SWATCHES[0].hex,
          wheels: v.wheels || WHEEL_OPTIONS[0],
          tires: v.tires || TIRE_OPTIONS[0],
          spoiler: v.spoiler || SPOILER_OPTIONS[0],
          exhaust: v.exhaust || EXHAUST_OPTIONS[0],
          suspension: v.suspension || SUSPENSION_OPTIONS[0],
          interior: v.interior || 'standard',
          isPublic: Boolean(v.isPublic),
          modelUrl: v.modelUrl || '',
          specs: {
            topSpeedKph: v.specs?.topSpeedKph ?? '',
            rangeKm: v.specs?.rangeKm ?? '',
            batteryKwh: v.specs?.batteryKwh ?? '',
            accel0to100: v.specs?.accel0to100 ?? '',
          },
        })
      )
      .catch(() => setError('Could not load that vehicle.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [name]: value } }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf') {
      setModelError('Only .glb or .gltf files are supported.');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      setModelError('File is larger than the 60MB limit.');
      return;
    }

    setModelError('');
    setModelBusy(true);
    setModelProgress(0);
    try {
      const url = await uploadModelFile(file, setModelProgress);
      setForm((prev) => ({ ...prev, modelUrl: url }));
    } catch (err) {
      setModelError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setModelBusy(false);
      e.target.value = '';
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setModelError('');
    setModelBusy(true);
    try {
      const url = await importModelFromUrl(urlInput.trim());
      setForm((prev) => ({ ...prev, modelUrl: url }));
      setUrlInput('');
    } catch (err) {
      setModelError(err.response?.data?.message || 'Import failed. Try again.');
    } finally {
      setModelBusy(false);
    }
  };

  const clearModel = () => {
    setForm((prev) => ({ ...prev, modelUrl: '' }));
    setModelError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...form,
      specs: {
        topSpeedKph: Number(form.specs.topSpeedKph) || 0,
        rangeKm: Number(form.specs.rangeKm) || 0,
        batteryKwh: Number(form.specs.batteryKwh) || 0,
        accel0to100: Number(form.specs.accel0to100) || 0,
      },
    };

    try {
      if (isEdit) {
        await updateVehicle(id, payload);
        navigate(`/vehicles/${id}`);
      } else {
        const created = await createVehicle(payload);
        navigate(`/vehicles/${created._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="configurator">
        <Link to="/vehicles" className="back-link">
          ← Back to garage
        </Link>
        <h1>{isEdit ? 'Configurator · Editing' : 'Configurator · New Build'}</h1>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted-line">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="configurator-grid">
            {/* Viewer column */}
            <div className="viewer-col">
              <Suspense
                fallback={<div className="viewer-3d viewer-loading">Loading 3D preview…</div>}
              >
                <VehicleViewer3D
                  color={form.color}
                  model={form.model}
                  wheelStyle={form.wheels}
                  modelUrl={form.modelUrl}
                  height={440}
                />
              </Suspense>
              <p className="preview-hint">
                Drag to rotate · shape is a stand-in, not the exact vehicle
              </p>

              <div className="field basics-row">
                <div>
                  <label htmlFor="name">Build name</label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Daily Driver"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="model">Model / type</label>
                  <input
                    id="model"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="e.g. Sedan, SUV, Coupe, Truck"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tabbed customize panel */}
            <div className="panel-col">
              <div className="tab-row">
                <button
                  type="button"
                  className={`tab-btn${tab === 'customize' ? ' active' : ''}`}
                  onClick={() => setTab('customize')}
                >
                  Customize
                </button>
                <button
                  type="button"
                  className={`tab-btn${tab === 'performance' ? ' active' : ''}`}
                  onClick={() => setTab('performance')}
                >
                  Performance
                </button>
                <button
                  type="button"
                  className={`tab-btn disabled`}
                  title="Coming soon — parts compatibility engine not built yet"
                  disabled
                >
                  Compatibility <span className="soon-tag">Soon</span>
                </button>
              </div>

              {tab === 'customize' && (
                <div className="tab-panel">
                  <p className="section-label">Paint</p>
                  <div className="swatch-row">
                    {PAINT_SWATCHES.map((p) => (
                      <button
                        type="button"
                        key={p.hex}
                        className={`paint-swatch${form.color === p.hex ? ' selected' : ''}`}
                        style={{ background: p.hex }}
                        title={p.name}
                        onClick={() => setForm((prev) => ({ ...prev, color: p.hex }))}
                      />
                    ))}
                    <input
                      type="color"
                      className="paint-swatch custom"
                      value={form.color}
                      onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                      title="Custom color"
                    />
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="wheels">Wheels</label>
                      <select id="wheels" name="wheels" value={form.wheels} onChange={handleChange}>
                        {WHEEL_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="tires">Tires</label>
                      <select id="tires" name="tires" value={form.tires} onChange={handleChange}>
                        {TIRE_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="spoiler">Spoiler</label>
                      <select id="spoiler" name="spoiler" value={form.spoiler} onChange={handleChange}>
                        {SPOILER_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="exhaust">Exhaust</label>
                      <select id="exhaust" name="exhaust" value={form.exhaust} onChange={handleChange}>
                        {EXHAUST_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="suspension">Suspension</label>
                      <select
                        id="suspension"
                        name="suspension"
                        value={form.suspension}
                        onChange={handleChange}
                      >
                        {SUSPENSION_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="interior">Interior</label>
                      <input
                        id="interior"
                        name="interior"
                        value={form.interior}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <label className="checkbox-line">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={form.isPublic}
                      onChange={handleChange}
                    />
                    Make this vehicle public
                  </label>

                  <p className="section-label">3D model (optional)</p>

                  {modelError && <div className="error-banner">{modelError}</div>}

                  {form.modelUrl ? (
                    <div className="model-attached">
                      <span>✓ Model attached</span>
                      <button type="button" className="text-btn danger" onClick={clearModel}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="upload-btn">
                        {modelBusy ? `Uploading… ${modelProgress}%` : 'Upload .glb / .gltf file'}
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          onChange={handleFileUpload}
                          disabled={modelBusy}
                          hidden
                        />
                      </label>

                      <div className="or-divider">or paste a direct link</div>

                      <div className="url-import-row">
                        <input
                          type="text"
                          placeholder="https://... (direct file link or Google Drive share link)"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          disabled={modelBusy}
                        />
                        <button
                          type="button"
                          className="text-btn"
                          onClick={handleUrlImport}
                          disabled={modelBusy || !urlInput.trim()}
                        >
                          Import
                        </button>
                      </div>
                      <p className="muted-line small">
                        Works for direct file links and Google Drive share links. Won't work
                        for CGTrader download links directly, since those require being
                        logged into your account — download it there first, then use the
                        upload button above.
                      </p>
                    </>
                  )}
                </div>
              )}

              {tab === 'performance' && (
                <div className="tab-panel">
                  <p className="section-label">Specs</p>
                  <p className="muted-line small">
                    These are entered manually for now — automatic projection based on parts
                    swaps is a planned feature, not built yet.
                  </p>
                  <div className="form-row four">
                    <div className="field">
                      <label htmlFor="rangeKm">Range (km)</label>
                      <input
                        id="rangeKm"
                        name="rangeKm"
                        type="number"
                        min="0"
                        value={form.specs.rangeKm}
                        onChange={handleSpecChange}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="topSpeedKph">Top speed (km/h)</label>
                      <input
                        id="topSpeedKph"
                        name="topSpeedKph"
                        type="number"
                        min="0"
                        value={form.specs.topSpeedKph}
                        onChange={handleSpecChange}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="batteryKwh">Battery (kWh)</label>
                      <input
                        id="batteryKwh"
                        name="batteryKwh"
                        type="number"
                        min="0"
                        value={form.specs.batteryKwh}
                        onChange={handleSpecChange}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="accel0to100">0–100 (sec)</label>
                      <input
                        id="accel0to100"
                        name="accel0to100"
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.specs.accel0to100}
                        onChange={handleSpecChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Build summary column */}
            <div className="summary-col">
              <div className="summary-card">
                <p className="eyebrow">Your Build</p>
                <div className="summary-swatch-row">
                  <span className="swatch lg" style={{ background: form.color }} />
                  <div>
                    <h3>{form.name || 'Untitled build'}</h3>
                    <p className="muted-line">{form.model || 'No model set'}</p>
                  </div>
                </div>

                <div className="summary-list">
                  <div>
                    <span>Wheels</span>
                    <span>{form.wheels}</span>
                  </div>
                  <div>
                    <span>Tires</span>
                    <span>{form.tires}</span>
                  </div>
                  <div>
                    <span>Spoiler</span>
                    <span>{form.spoiler}</span>
                  </div>
                  <div>
                    <span>Exhaust</span>
                    <span>{form.exhaust}</span>
                  </div>
                  <div>
                    <span>Suspension</span>
                    <span>{form.suspension}</span>
                  </div>
                  <div>
                    <span>Top speed</span>
                    <span>{form.specs.topSpeedKph || '—'} km/h</span>
                  </div>
                  <div>
                    <span>0–100</span>
                    <span>{form.specs.accel0to100 || '—'} s</span>
                  </div>
                </div>

                <button className="submit-btn wide" type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save build'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
