import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api.js';
import './App.css';

const iconContent = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h2a5.5 5.5 0 0 1 5.5 5.5V20" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6" />
      <path d="M18 14h.5a4 4 0 0 1 4 4v2" />
    </>
  ),
  scans: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  arrow: <path d="M7 17 17 7M7 7h10v10" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  filter: (
    <>
      <path d="M4 6h16M7 12h10m-7 6h4" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </>
  ),
  searchCheck: (
    <>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="m16 16 4.5 4.5" />
      <path d="m7.5 10.5 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
      <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14z" />
    </>
  ),
  activity: (
    <>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </>
  )
};

function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconContent[name] || iconContent.overview}
    </svg>
  );
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'scans', label: 'Scan activity', icon: 'scans' }
];

const demoScans = [
  {
    id: 's1',
    title: 'Subscription Terms of Service',
    domain: 'streamline.example',
    owner: 'mira.shah@example.com',
    initials: 'MS',
    date: 'Today, 09:42 AM',
    findings: 4,
    risk: 'High',
    category: 'Automatic renewal'
  },
  {
    id: 's2',
    title: 'Privacy Policy Review',
    domain: 'shopwise.example',
    owner: 'dev.kapoor@example.com',
    initials: 'DK',
    date: 'Today, 09:18 AM',
    findings: 2,
    risk: 'Medium',
    category: 'Data collection'
  },
  {
    id: 's3',
    title: 'Membership Agreement',
    domain: 'fitclub.example',
    owner: 'priya.singh@example.com',
    initials: 'PS',
    date: 'Today, 08:54 AM',
    findings: 5,
    risk: 'High',
    category: 'Cancellation barriers'
  },
  {
    id: 's4',
    title: 'Software License Agreement',
    domain: 'cloudsuite.example',
    owner: 'aarav.rao@example.com',
    initials: 'AR',
    date: 'Yesterday, 04:31 PM',
    findings: 1,
    risk: 'Low',
    category: 'Unclear wording'
  },
  {
    id: 's5',
    title: 'Free Trial Conditions',
    domain: 'designbox.example',
    owner: 'rohan.nair@example.com',
    initials: 'RN',
    date: 'Yesterday, 02:15 PM',
    findings: 3,
    risk: 'Medium',
    category: 'Hidden fees'
  }
];


const pageDetails = {
  overview: {
    title: 'Overview',
    description: 'Here is what is happening across ClearContract.'
  },
  users: {
    title: 'User management',
    description: 'Review accounts and understand how the product is being used.'
  },
  scans: {
    title: 'Scan activity',
    description: 'Inspect recent contract analyses and detected risk categories.'
  }
};

function Avatar({ initials, size = 'normal' }) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {initials}
    </span>
  );
}

function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function RiskPill({ risk }) {
  return (
    <span className={`risk-pill risk-${risk.toLowerCase()}`}>
      <span className="risk-dot" />
      {risk}
    </span>
  );
}

function OverviewPage({ searchQuery, onNavigate, dashboardStats, statsError }) {
  const recentScans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return demoScans.slice(0, 4);

    return demoScans.filter((scan) =>
      [
        scan.title,
        scan.domain,
        scan.owner,
        scan.category
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const stats = dashboardStats?.stats;
  const categories = dashboardStats?.commonRiskCategories ?? [];
  const topRisk = categories[0];
  const maxCategoryCount = Math.max(
    1,
    ...categories.map((category) =>
      Number.isFinite(category.count) ? category.count : 0
    )
  );

  const formatCount = (value) =>
    Number.isFinite(value) ? value.toLocaleString() : '—';

  const displayStat = (value) => {
    if (statsError) return 'Unavailable';
    if (!stats) return 'Loading...';
    return formatCount(value);
  };

  return (
    <>
      {statsError && (
        <div className="auth-error" role="alert">
          Could not load live statistics: {statsError}
        </div>
      )}

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-blue">
              <Icon name="users" size={20} />
            </span>
            <span className="stat-neutral">All accounts</span>
          </div>
          <p className="stat-label">Total users</p>
          <div className="stat-bottom">
            <strong>{displayStat(stats?.totalUsers)}</strong>
            <span>Registered accounts</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-purple">
              <Icon name="scans" size={20} />
            </span>
            <span className="stat-neutral">All time</span>
          </div>
          <p className="stat-label">Total scans</p>
          <div className="stat-bottom">
            <strong>{displayStat(stats?.totalScans)}</strong>
            <span>Recorded analyses</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-green">
              <Icon name="activity" size={20} />
            </span>
            <span className="stat-neutral">Last 7 days</span>
          </div>
          <p className="stat-label">Scans this week</p>
          <div className="stat-bottom">
            <strong>{displayStat(stats?.scansLast7Days)}</strong>
            <span>Recent analyses</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-orange">
              <Icon name="shield" size={20} />
            </span>
            <span className="stat-neutral">Top category</span>
          </div>
          <p className="stat-label">Most detected risk</p>
          <div className="stat-bottom">
            <strong className="stat-text-value">
              {topRisk?.category ?? (
                statsError
                  ? 'Unavailable'
                  : dashboardStats
                    ? 'No findings yet'
                    : 'Loading...'
              )}
            </strong>
          </div>
        </article>
      </div>

      <div className="overview-grid">
        <section className="panel risk-panel">
          <SectionHeading
            title="Common risk categories"
            subtitle="Most frequently detected patterns"
            action={
              <span className="panel-period">
                <Icon name="clock" size={14} />
                All time
              </span>
            }
          />

          {categories.length > 0 ? (
            <div className="risk-chart">
              {categories.map((category, index) => (
                <div className="risk-chart-row" key={category.category}>
                  <div className="risk-chart-label">
                    <span className={`category-index index-${index + 1}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{category.category}</span>
                    <strong>{formatCount(category.count)}</strong>
                  </div>
                  <div
                    className="bar-track"
                    role="img"
                    aria-label={`${category.category}: ${category.count} detections`}
                  >
                    <div
                      className={`bar-fill bar-fill-${index + 1}`}
                      style={{
                        width: `${Math.round(
                          ((Number.isFinite(category.count) ? category.count : 0) /
                            maxCategoryCount) *
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {statsError
                ? 'Risk categories could not be loaded.'
                : dashboardStats
                  ? 'No risk categories recorded yet.'
                  : 'Loading risk categories...'}
            </div>
          )}

          <div className="chart-footnote">
            <span className="legend-dot" />
            Detected risk instances
            <span className="chart-footnote-note">Live database data</span>
          </div>
        </section>

        <aside className="insight-card">
          <div className="insight-top">
            <span className="insight-icon">
              <Icon name="spark" size={21} />
            </span>
            <span className="insight-kicker">ADMIN INSIGHT</span>
          </div>

          <h2>
            {topRisk
              ? `Watch for recurring ${topRisk.category.toLowerCase()} patterns.`
              : 'Monitor detected risk patterns.'}
          </h2>
          <p>
            {topRisk
              ? `${topRisk.category} is currently the most frequently detected category in recorded scans. These findings can help prioritize product improvements and future analysis quality checks.`
              : statsError
                ? 'Risk insights are unavailable because the dashboard could not load the statistics.'
                : dashboardStats
                  ? 'Risk insights will appear when scan results include detected categories.'
                  : 'Risk insights will appear after the statistics load.'}
          </p>

          <div className="insight-metric">
            <div>
              <span>Leading category</span>
              <strong>{topRisk?.category ?? 'No findings yet'}</strong>
            </div>
            <strong className="insight-count">
              {topRisk ? formatCount(topRisk.count) : dashboardStats ? '0' : '—'}
            </strong>
          </div>

          <button
            className="text-link"
            type="button"
            onClick={() => onNavigate('scans')}
          >
            Explore scan activity
            <Icon name="arrow" size={16} />
          </button>

          <div className="insight-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </aside>
      </div>

      <section className="panel activity-panel">
        <SectionHeading
          title="Recent scan activity"
          subtitle="Preview of recent contract analyses"
          action={
            <button
              className="button button-secondary"
              type="button"
              onClick={() => onNavigate('scans')}
            >
              View all scans
              <Icon name="chevron" size={15} />
            </button>
          }
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contract / website</th>
                <th>Scanned by</th>
                <th>Scanned on</th>
                <th>Findings</th>
                <th>Risk level</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((scan) => (
                <tr key={scan.id}>
                  <td>
                    <div className="contract-cell">
                      <span className="site-icon">
                        <Icon name="scans" size={17} />
                      </span>
                      <span className="contract-copy">
                        <strong>{scan.title}</strong>
                        <span>{scan.domain}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="email-cell">{scan.owner}</span>
                  </td>
                  <td className="date-cell">{scan.date}</td>
                  <td>
                    <span className="findings-count">
                      {scan.findings} findings
                    </span>
                  </td>
                  <td>
                    <RiskPill risk={scan.risk} />
                  </td>
                </tr>
              ))}
              {recentScans.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      No sample scans match your search.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Recent scan preview</span>
          <span>Sample records, not live scan data</span>
        </div>
      </section>
    </>
  );
}

function UsersPage({
  users,
  loading,
  error,
  pagination,
  onPageChange
}) {
  const totalUsers = pagination?.total ?? 0;
  const currentPage = pagination?.page ?? 1;
  const pageSize = pagination?.limit ?? 20;
  const totalPages = pagination?.totalPages ?? 0;

  const scansOnPage = users.reduce(
    (total, user) => total + (Number(user.scanCount) || 0),
    0
  );

  const formatDate = (value) => {
    if (!value) return 'Unknown';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const start =
    totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const end = Math.min(
    (currentPage - 1) * pageSize + users.length,
    totalUsers
  );

  return (
    <>
      {error && (
        <div className="auth-error" role="alert">
          Could not load real users: {error}
        </div>
      )}

      <div className="page-summary-row">
        <div className="summary-stat">
          <span className="summary-stat-icon">
            <Icon name="users" size={19} />
          </span>

          <div>
            <span>Total registered users</span>
            <strong>
              {loading ? 'Loading...' : error ? 'Unavailable' : totalUsers.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="summary-stat">
          <span className="summary-stat-icon summary-stat-green">
            <Icon name="activity" size={19} />
          </span>

          <div>
            <span>Scans by displayed users</span>
            <strong>
              {loading
                ? 'Loading...'
                : error
                  ? 'Unavailable'
                  : scansOnPage.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      <section className="panel activity-panel">
        <SectionHeading
          title="Registered users"
          subtitle="Real accounts from the ClearContract database"
          action={
            <span className="preview-label">
              <span className="preview-dot" />
              Live records
            </span>
          }
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User account</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Scan count</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      Loading registered users...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      User records could not be loaded. Check the API error above.
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      No registered users found.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const email =
                    typeof user.email === 'string'
                      ? user.email
                      : 'Unknown email';

                  const username = email.split('@')[0];

                  const initials =
                    username.slice(0, 2).toUpperCase() || 'U';

                  const isAdmin = user.role === 'admin';

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <Avatar initials={initials} />

                          <span className="user-copy">
                            <strong>{email}</strong>
                            <span>
                              ID: {String(user.id).slice(-8)}
                            </span>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`role-pill ${
                            isAdmin ? 'role-admin' : 'role-user'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>

                      <td className="date-cell">
                        {formatDate(user.createdAt)}
                      </td>

                      <td>
                        <strong className="table-number">
                          {(Number(user.scanCount) || 0).toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            {loading
              ? 'Loading records...'
              : error
                ? 'Records unavailable'
                : totalUsers === 0
                  ? 'No registered users'
                  : `Showing ${start}–${end} of ${totalUsers} registered users`}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="button button-secondary"
              type="button"
              disabled={loading || currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </button>

            <button
              className="button button-secondary"
              type="button"
              disabled={
                loading ||
                totalPages === 0 ||
                currentPage >= totalPages
              }
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function ScansPage({ searchQuery }) {
  const filteredScans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return demoScans;

    return demoScans.filter((scan) =>
      [
        scan.title,
        scan.domain,
        scan.owner,
        scan.category,
        scan.risk
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <>
      <div className="page-summary-row">
        <div className="summary-stat">
          <span className="summary-stat-icon">
            <Icon name="scans" size={19} />
          </span>
          <div>
            <span>Scans in this preview</span>
            <strong>{filteredScans.length}</strong>
          </div>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-icon summary-stat-orange">
            <Icon name="shield" size={19} />
          </span>
          <div>
            <span>Findings in listed scans</span>
            <strong>
              {filteredScans.reduce((total, scan) => total + scan.findings, 0)}
            </strong>
          </div>
        </div>
      </div>

      <section className="panel activity-panel">
        <SectionHeading
          title="All recent scans"
          subtitle="Contract analysis activity and detected risks"
          action={
            <span className="preview-label">
              <span className="preview-dot" />
              Sample records
            </span>
          }
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contract / website</th>
                <th>Scanned by</th>
                <th>Scanned on</th>
                <th>Findings</th>
                <th>Risk level</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.map((scan) => (
                <tr key={scan.id}>
                  <td>
                    <div className="contract-cell">
                      <span className="site-icon">
                        <Icon name="scans" size={17} />
                      </span>
                      <span className="contract-copy">
                        <strong>{scan.title}</strong>
                        <span>{scan.domain}</span>
                        <span className="scan-category">{scan.category}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="email-cell">{scan.owner}</span>
                  </td>
                  <td className="date-cell">{scan.date}</td>
                  <td>
                    <span className="findings-count">
                      {scan.findings} findings
                    </span>
                  </td>
                  <td>
                    <RiskPill risk={scan.risk} />
                  </td>
                </tr>
              ))}
              {filteredScans.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      No sample scans match your search.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filteredScans.length} sample scans</span>
          <span>Live scan data will be connected next</span>
        </div>
      </section>
    </>
  );
}


const ADMIN_TOKEN_KEY = 'clearcontract_admin_token';

function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  error,
  submitting
}) {
  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <span className="auth-brand-mark">
          <Icon name="shield" size={25} />
        </span>

        <p className="auth-kicker">CLEARCONTRACT · ADMIN CONSOLE</p>
        <h1>Administrator sign in</h1>
        <p className="auth-description">
          Sign in with your ClearContract account to access the
          protected administrator dashboard.
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <label className="auth-field">
          Email address
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
          />
        </label>

        <label className="auth-field">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button
          className="auth-submit-button"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Signing in...' : 'Sign in securely'}
        </button>

        <p className="auth-security-note">
          Administrator access is verified by the backend.
          A regular user account cannot access this console.
        </p>
      </form>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [token, setToken] = useState(
    () => sessionStorage.getItem(ADMIN_TOKEN_KEY)
  );
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY))
  );
  const [authError, setAuthError] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsError, setStatsError] = useState('');

  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersPage, setUsersPage] = useState(1);

  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Verify the JWT and administrator role using the protected backend.
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      return () => {
        cancelled = true;
      };
    }

    apiRequest('/api/admin/me', { token })
      .then((result) => {
        if (cancelled) return;

        if (!result?.admin) {
          throw new Error('The API did not return an administrator account.');
        }

        setAdmin(result.admin);
        setAuthError('');
      })
      .catch((error) => {
        if (cancelled) return;

        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdmin(null);
        setToken(null);

        if (error.status === 403) {
          setAuthError(
            'This account does not have administrator privileges.'
          );
        } else if (error.status === 401) {
          setAuthError(
            'Your session is invalid or expired. Please sign in again.'
          );
        } else {
          setAuthError(
            `Could not verify administrator access. ${error.message}`
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !admin) return;

    let cancelled = false;

    apiRequest('/api/admin/stats', { token })
      .then((result) => {
        if (cancelled) return;

        if (!result?.stats) {
          throw new Error('Invalid statistics response from the API.');
        }

        setDashboardStats(result);
        setStatsError('');
      })
      .catch((error) => {
        if (cancelled) return;

        setStatsError(error.message || 'Failed to load statistics.');
        setDashboardStats(null);

        if (error.status === 401 || error.status === 403) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken(null);
          setAdmin(null);

          setAuthError(
            error.status === 403
              ? 'Administrator access is required.'
              : 'Your session has expired. Please sign in again.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, admin]);


  useEffect(() => {
    if (!token || !admin || activePage !== 'users') return;

    let cancelled = false;

    const params = new URLSearchParams({
      page: String(usersPage),
      limit: '20'
    });

    const query = searchQuery.trim().slice(0, 100);

    if (query) {
      params.set('q', query);
    }

    apiRequest(`/api/admin/users?${params.toString()}`, { token })
      .then((result) => {
        if (cancelled) return;

        if (!Array.isArray(result?.users) || !result?.pagination) {
          throw new Error('Invalid user-list response from the API.');
        }

        setAdminUsers(result.users);
        setUsersPagination(result.pagination);
        setUsersError('');
      })
      .catch((error) => {
        if (cancelled) return;

        setAdminUsers([]);
        setUsersError(error.message || 'Failed to load registered users.');

        if (error.status === 401 || error.status === 403) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken(null);
          setAdmin(null);

          setAuthError(
            error.status === 403
              ? 'Administrator access is required.'
              : 'Your session has expired. Please sign in again.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setUsersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, admin, activePage, searchQuery, usersPage]);

  // Login first, then let /api/admin/me verify the account's role.
  const handleLogin = async (event) => {
    event.preventDefault();

    setAuthError('');
    setStatsError('');
    setDashboardStats(null);
    setLoginSubmitting(true);

    try {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: loginEmail.trim(),
          password: loginPassword
        }
      });

      if (!result.token) {
        throw new Error('The login response did not contain a token.');
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      setLoginPassword('');
      setAuthLoading(true);
      setToken(result.token);
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setAdmin(null);
    setAuthError('');
    setStatsError('');
    setDashboardStats(null);
    setLoginPassword('');
    setSearchQuery('');
    setActivePage('overview');
  };

  const page = pageDetails[activePage] || pageDetails.overview;

  const navigateTo = (pageId) => {
    const pageChanging = pageId !== activePage;

    setActivePage(pageId);
    setSearchQuery('');

    if (pageId === 'users' && pageChanging) {
      setUsersPage(1);
      setUsersLoading(true);
      setUsersError('');
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (activePage === 'users') {
      setUsersPage(1);
      setUsersLoading(true);
      setUsersError('');
    }
  };

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-loading-card" role="status">
          <span className="auth-brand-mark">
            <Icon name="shield" size={25} />
          </span>
          <h1>Verifying access</h1>
          <p className="auth-description">
            Checking your administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <LoginScreen
        email={loginEmail}
        setEmail={setLoginEmail}
        password={loginPassword}
        setPassword={setLoginPassword}
        onSubmit={handleLogin}
        error={authError}
        submitting={loginSubmitting}
      />
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="shield" size={23} />
          </span>
          <div className="brand-copy">
            <strong>ClearContract</strong>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={`nav-item ${
                activePage === item.id ? 'nav-item-active' : ''
              }`}
              type="button"
              key={item.id}
              onClick={() => navigateTo(item.id)}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {activePage === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-security">
          <span className="security-mark">
            <Icon name="shield" size={20} />
          </span>
          <strong>Security first</strong>
          <p>
            Administrative access is protected by the backend API.
          </p>
          <span className="security-status">
            <span />
            Partially live
          </span>
        </div>

        <div className="sidebar-account">
          <Avatar initials="AD" />
          <div className="account-copy">
            <strong>{admin.email || 'Administrator'}</strong>
            <span>Admin workspace</span>
          </div>
          <Icon name="chevron" size={16} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>ClearContract</span>
            <Icon name="chevron" size={14} />
            <strong>{page.title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="preview-badge">
              <span />
              PARTIALLY LIVE
            </span>
            <button
              className="icon-button notification-button"
              type="button"
              aria-label="Notifications (preview only)"
              title="Notifications will be implemented later"
            >
              <Icon name="bell" size={19} />
              <span className="notification-dot" />
            </button>
            <span className="topbar-divider" />
            <Avatar initials="AD" size="small" />

            <button
              className="button button-secondary auth-logout-button"
              type="button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                CLEARCONTRACT ANALYTICS
              </div>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
            </div>

            <div className="page-heading-actions">
              <label className="search-box">
                <Icon name="search" size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  maxLength={activePage === 'users' ? 100 : undefined}
                  placeholder={
                    activePage === 'users'
                      ? 'Search users...'
                      : activePage === 'scans'
                        ? 'Search scans...'
                        : 'Search recent activity...'
                  }
                  aria-label="Search current dashboard page"
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </label>
            </div>
          </div>

          <div className="demo-banner">
            <span className="demo-banner-icon">
              <Icon name="activity" size={18} />
            </span>
            <p>
              <strong>Partially connected.</strong> Overview statistics and risk
              categories use live database data. The user directory also uses live
              database data. Recent scan activity and the Scan Activity table still
              use sample records.
            </p>
            <span className="demo-banner-tag">PARTIALLY LIVE</span>
          </div>

          {activePage === 'overview' && (
            <OverviewPage
              searchQuery={searchQuery}
              onNavigate={navigateTo}
              dashboardStats={dashboardStats}
              statsError={statsError}
            />
          )}

          {activePage === 'users' && (
            <UsersPage
              users={adminUsers}
              loading={usersLoading}
              error={usersError}
              pagination={usersPagination}
              onPageChange={(nextPage) => {
                setUsersPage(nextPage);
                setUsersLoading(true);
                setUsersError('');
              }}
            />
          )}

          {activePage === 'scans' && (
            <ScansPage searchQuery={searchQuery} />
          )}

          <footer className="dashboard-footer">
            <span>
              <Icon name="shield" size={15} />
              ClearContract Admin Console
            </span>
            <span>Secure oversight for safer agreements</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;