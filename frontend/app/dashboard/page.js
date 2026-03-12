export default function DashboardPage() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Umumiy ko'rinish</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">—</div>
            <div className="stat-label">O'qituvchilar</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon--gold">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">—</div>
            <div className="stat-label">Guruhlar</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon--green">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">—</div>
            <div className="stat-label">To'lovlar</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon--red">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">—</div>
            <div className="stat-label">Qarzdorlar</div>
          </div>
        </div>
      </div>

      <div className="coming-soon-banner">
        <div className="coming-soon-icon">🚀</div>
        <div>
          <div className="coming-soon-title">Tez orada!</div>
          <div className="coming-soon-text">Barcha bo'limlar ishga tushirilmoqda. Kuting!</div>
        </div>
      </div>
    </div>
  );
}
