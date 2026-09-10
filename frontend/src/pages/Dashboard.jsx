import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">EVE</div>
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="dash-body">
        <div className="dash-hero">
          <p className="eyebrow">Signed in</p>
          <h1>Welcome back, {user?.username}.</h1>
          <p>
            This is your starting point. Wire up your vehicle data here and
            it'll show up in the summary below.
          </p>
        </div>

        <div className="dash-grid">
          <div className="dash-stat">
            <div className="num">0</div>
            <div className="label">Saved vehicles</div>
          </div>
          <div className="dash-stat">
            <div className="num">—</div>
            <div className="label">Last activity</div>
          </div>
          <div className="dash-stat">
            <div className="num">{user?.email}</div>
            <div className="label">Account email</div>
          </div>
        </div>
      </div>
    </div>
  );
}
