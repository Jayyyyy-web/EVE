import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVehicle, createVehicle, updateVehicle } from '../api/vehicles';

const emptyForm = {
  name: '',
  model: '',
  color: '#7c5cff',
  wheels: 'standard',
  interior: 'standard',
  isPublic: false,
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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getVehicle(id)
      .then((v) =>
        setForm({
          name: v.name || '',
          model: v.model || '',
          color: v.color || '#7c5cff',
          wheels: v.wheels || 'standard',
          interior: v.interior || 'standard',
          isPublic: Boolean(v.isPublic),
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
      } else {
        await createVehicle(payload);
      }
      navigate('/vehicles');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <Link to="/dashboard" className="brand">
          EVE
        </Link>
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="dash-body narrow">
        <Link to="/vehicles" className="back-link">
          ← Back to vehicles
        </Link>
        <h1>{isEdit ? 'Edit vehicle' : 'Add a vehicle'}</h1>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted-line">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="vehicle-form">
            <div className="form-row">
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Daily Driver"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="model">Model / type</label>
                <input
                  id="model"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. Sedan, SUV, Coupe"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="color">Color</label>
                <input
                  id="color"
                  name="color"
                  type="color"
                  value={form.color}
                  onChange={handleChange}
                  className="color-input"
                />
              </div>
              <div className="field">
                <label htmlFor="wheels">Wheels</label>
                <input id="wheels" name="wheels" value={form.wheels} onChange={handleChange} />
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

            <p className="section-label">Specs</p>
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

            <label className="checkbox-line">
              <input
                type="checkbox"
                name="isPublic"
                checked={form.isPublic}
                onChange={handleChange}
              />
              Make this vehicle public
            </label>

            <button className="submit-btn wide" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
