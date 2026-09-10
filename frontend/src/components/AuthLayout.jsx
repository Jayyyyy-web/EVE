export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <svg className="route-line" viewBox="0 0 400 800" preserveAspectRatio="none">
          <path
            d="M -20 700 C 80 650, 60 500, 160 460 S 300 380, 260 250 S 380 100, 340 -20"
            fill="none"
            stroke="#2a3346"
            strokeWidth="2"
          />
          <circle cx="-20" cy="700" r="4" fill="#155eef" />
          <circle cx="340" cy="-20" r="4" fill="#155eef" />
        </svg>
        <div className="brand">EVE</div>
        <div className="hero-copy">
          <h1>Track and manage your fleet in one place.</h1>
          <p>
            Sign in to view your saved vehicles, monitor status, and pick up
            right where you left off.
          </p>
        </div>
        <div className="hero-foot">© {new Date().getFullYear()} EVE</div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
