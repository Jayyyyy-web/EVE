import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVehicles } from '../api/vehicles';
import AppLayout from '../components/AppLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const [vehicleCount, setVehicleCount] = useState(null);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    getVehicles()
      .then((data) => {
        const mine = data.filter((v) => String(v.owner?._id || v.owner) === user.id);
        setVehicleCount(mine.length);
        if (mine.length > 0) {
          const sorted = [...mine].sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          setLatest(sorted[0]);
        }
      })
      .catch(() => setVehicleCount(0));
  }, [user.id]);

  return (
    <AppLayout>
      <div className="dash-body">
        <div className="dash-hero">
          <p className="eyebrow">
            Signed in{user?.role === 'admin' ? ' · Admin' : ''}
          </p>
          <h1>Welcome back, {user?.username}.</h1>
          <p>Here's a quick look at your garage.</p>
        </div>

        <div className="dash-grid">
          <Link to="/vehicles" className="dash-stat linked">
            <div className="num">{vehicleCount === null ? '…' : vehicleCount}</div>
            <div className="label">Saved vehicles</div>
          </Link>
          <div className="dash-stat">
            <div className="num">{latest ? latest.name : '—'}</div>
            <div className="label">Last updated</div>
          </div>
          <div className="dash-stat">
            <div className="num">{user?.username}</div>
            <div className="label">Username</div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
