import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVehicles, deleteVehicle } from '../api/vehicles';

export default function Vehicles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getVehicles()
      .then((data) => {
        const mine = data.filter((v) => String(v.owner?._id || v.owner) === user.id);
        setVehicles(mine);
      })
      .catch(() => setError('Could not load vehicles.'))
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This can\'t be undone.')) return;
    setDeletingId(id);
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
    } catch {
      setError('Could not delete that vehicle.');
    } finally {
      setDeletingId(null);
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

      <div className="dash-body">
        <div className="page-header">
          <div>
            <h1>Your vehicles</h1>
            <p>Everything you've added to your garage.</p>
          </div>
          <button className="primary-btn" onClick={() => navigate('/vehicles/new')}>
            + Add vehicle
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted-line">Loading…</p>
        ) : vehicles.length === 0 ? (
          <div className="empty-state">
            <h3>No vehicles yet</h3>
            <p>Add your first one to start tracking it here.</p>
            <button className="primary-btn" onClick={() => navigate('/vehicles/new')}>
              + Add vehicle
            </button>
          </div>
        ) : (
          <div className="vehicle-grid">
            {vehicles.map((v) => (
              <div className="vehicle-card" key={v._id}>
                <div className="vehicle-card-top">
                  <span className="swatch" style={{ background: v.color || '#888' }} />
                  <div>
                    <Link to={`/vehicles/${v._id}`} className="card-title-link">
                      <h3>{v.name}</h3>
                    </Link>
                    <p className="muted-line">{v.model}</p>
                  </div>
                </div>

                <div className="spec-row">
                  <div>
                    <span className="spec-val">{v.specs?.rangeKm ?? 0}</span>
                    <span className="spec-label">km range</span>
                  </div>
                  <div>
                    <span className="spec-val">{v.specs?.topSpeedKph ?? 0}</span>
                    <span className="spec-label">km/h top</span>
                  </div>
                  <div>
                    <span className="spec-val">{v.specs?.accel0to100 ?? 0}s</span>
                    <span className="spec-label">0–100</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="text-btn"
                    onClick={() => navigate(`/vehicles/${v._id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-btn danger"
                    onClick={() => handleDelete(v._id)}
                    disabled={deletingId === v._id}
                  >
                    {deletingId === v._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
