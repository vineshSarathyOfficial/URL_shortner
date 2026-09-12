import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { linksApi } from '../api/client';
import type { Analytics as AnalyticsType } from '../api/client';
import Navbar from '../components/Navbar';

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    linksApi.analytics(id, period)
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [id, period]);

  return (
    <div className="app-page">
      <Navbar variant="app" />

      <main className="app-main">
        <div className="container">
          <div className="page-header">
            <div>
              <span className="caption-uppercase">Analytics</span>
              <h1 className="display-sm">Link performance</h1>
            </div>
            <Link to="/dashboard" className="btn-secondary">← Back to dashboard</Link>
          </div>

          <div className="period-tabs">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`period-tab ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="loading-text">Loading analytics...</p>
          ) : analytics ? (
            <>
              <div className="analytics-grid">
                <div className="stat-card-teal">
                  <span className="caption-uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Total clicks
                  </span>
                  <p className="stat-value">{analytics.total_clicks}</p>
                </div>
                <div className="feature-card feature-card-peach">
                  <h3>Daily average</h3>
                  <p style={{ fontSize: 32, fontWeight: 600, marginTop: 8 }}>
                    {analytics.clicks_by_day.length > 0
                      ? Math.round(
                          analytics.clicks_by_day.reduce((s, d) => s + d.count, 0) /
                            analytics.clicks_by_day.length
                        )
                      : 0}
                  </p>
                </div>
                <div className="feature-card feature-card-lavender">
                  <h3>Active days</h3>
                  <p style={{ fontSize: 32, fontWeight: 600, marginTop: 8 }}>
                    {analytics.clicks_by_day.length}
                  </p>
                </div>
              </div>

              <div className="analytics-row">
                <div className="content-card">
                  <h3 className="title-md" style={{ marginBottom: 16 }}>Clicks by day</h3>
                  {analytics.clicks_by_day.length === 0 ? (
                    <p className="body-sm" style={{ color: 'var(--muted)' }}>No clicks recorded yet.</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.clicks_by_day.map((row) => (
                          <tr key={row.date}>
                            <td>{row.date}</td>
                            <td>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="content-card">
                  <h3 className="title-md" style={{ marginBottom: 16 }}>Recent accesses</h3>
                  {analytics.recent_accesses.length === 0 ? (
                    <p className="body-sm" style={{ color: 'var(--muted)' }}>No recent accesses.</p>
                  ) : (
                    <ul className="recent-list">
                      {analytics.recent_accesses.map((access, i) => (
                        <li key={i}>{new Date(access.accessed_at).toLocaleString()}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="alert-error">Failed to load analytics.</div>
          )}
        </div>
      </main>
    </div>
  );
}
