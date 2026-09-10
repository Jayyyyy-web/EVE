import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getVehicle, deleteVehicle } from '../api/vehicles';
import AppLayout from '../components/AppLayout';

const VehicleViewer3D = lazy(() => import('../components/VehicleViewer3D'));

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getVehicle(id)
      .then(setVehicle)
      .catch(() => setError('Could not load this vehicle.'));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this vehicle? This can\'t be undone.')) return;
    setDeleting(true);
    try {
      await deleteVehicle(id);
      navigate('/vehicles');
    } catch {
      setError('Could not delete this vehicle.');
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="dash-body form-page">
        <Link to="/vehicles" className="back-link">
          ← Back to vehicles
        </Link>

        {error && <div className="error-banner">{error}</div>}

        {!vehicle ? (
          <p className="muted-line">Loading…</p>
        ) : (
          <div className="form-split">
            <div className="preview-pane">
              <Suspense fallback={<div className="viewer-3d viewer-loading">Loading 3D preview…</div>}>
                <VehicleViewer3D
                  color={vehicle.color}
                  model={vehicle.model}
                  wheelStyle={vehicle.wheels}
                  height={440}
                />
              </Suspense>
              <p className="preview-hint">Drag to rotate</p>
            </div>

            <div className="detail-panel">
              <h1>{vehicle.name}</h1>
              <p className="muted-line">{vehicle.model}</p>

              <p className="section-label">Performance</p>
              <div className="dash-grid three">
                <div className="dash-stat">
                  <div className="num">{vehicle.specs?.rangeKm ?? 0}</div>
                  <div className="label">Range (km)</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.specs?.topSpeedKph ?? 0}</div>
                  <div className="label">Top speed (km/h)</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.specs?.batteryKwh ?? 0}</div>
                  <div className="label">Battery (kWh)</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.specs?.accel0to100 ?? 0}s</div>
                  <div className="label">0–100</div>
                </div>
              </div>

              <p className="section-label">Build</p>
              <div className="dash-grid three">
                <div className="dash-stat">
                  <div className="num">{vehicle.wheels}</div>
                  <div className="label">Wheels</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.tires || 'stock'}</div>
                  <div className="label">Tires</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.spoiler || 'none'}</div>
                  <div className="label">Spoiler</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.exhaust || 'stock'}</div>
                  <div className="label">Exhaust</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.suspension || 'stock'}</div>
                  <div className="label">Suspension</div>
                </div>
                <div className="dash-stat">
                  <div className="num">{vehicle.interior}</div>
                  <div className="label">Interior</div>
                </div>
              </div>

              <div className="card-actions detail-actions">
                <button
                  className="primary-btn"
                  onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}
                >
                  Edit in Configurator
                </button>
                <button className="text-btn danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete vehicle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
