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
        <h1>Welcome, {user?.username}.</h1>
        <p>You're signed in. This is a starting point — wire up your vehicle data here.</p>
      </div>
    </div>
  );
}
