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

// Placeholder records for the UI preview. These are not live database data.
const demoUsers = [
  {
    id: 'u1',
    initials: 'AR',
    name: 'Aarav Rao',
    email: 'aarav.rao@example.com',
    role: 'Admin',
    joined: 'Oct 12, 2026',
    scans: 126,
    status: 'Active'
  },
  {
    id: 'u2',
    initials: 'MS',
    name: 'Mira Shah',
    email: 'mira.shah@example.com',
    role: 'User',
    joined: 'Oct 10, 2026',
    scans: 48,
    status: 'Active'
  },
  {
    id: 'u3',
    initials: 'DK',
    name: 'Dev Kapoor',
    email: 'dev.kapoor@example.com',
    role: 'User',
    joined: 'Oct 08, 2026',
    scans: 31,
    status: 'Active'
  },
  {
    id: 'u4',
    initials: 'PS',
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    role: 'User',
    joined: 'Oct 06, 2026',
    scans: 17,
    status: 'Active'
  },
  {
    id: 'u5',
    initials: 'RN',
    name: 'Rohan Nair',
    email: 'rohan.nair@example.com',
    role: 'User',
    joined: 'Oct 04, 2026',
    scans: 9,
    status: 'Active'
  }
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

const riskCategories = [
  { label: 'Automatic renewal', count: 86, percentage: 86 },
  { label: 'Hidden fees', count: 64, percentage: 64 },
  { label: 'Cancellation barriers', count: 52, percentage: 52 },
  { label: 'Privacy concerns', count: 38, percentage: 38 },
  { label: 'Forced continuity', count: 24, percentage: 24 }
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

function OverviewPage({ searchQuery, onNavigate }) {
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

  return (
    <>
      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-blue">
              <Icon name="users" size={20} />
            </span>
            <span className="trend trend-up">+12.8%</span>
          </div>
          <p className="stat-label">Total users</p>
          <div className="stat-bottom">
            <strong>1,284</strong>
            <span>vs. last month</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-purple">
              <Icon name="scans" size={20} />
            </span>
            <span className="trend trend-up">+8.4%</span>
          </div>
          <p className="stat-label">Total scans</p>
          <div className="stat-bottom">
            <strong>8,492</strong>
            <span>vs. last month</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon stat-icon-green">
              <Icon name="activity" size={20} />
            </span>
            <span className="trend trend-up">+5.2%</span>
          </div>
          <p className="stat-label">Scans this week</p>
          <div className="stat-bottom">
            <strong>684</strong>
            <span>vs. last week</span>
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
            <strong className="stat-text-value">Auto-renewal</strong>
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

          <div className="risk-chart">
            {riskCategories.map((category, index) => (
              <div className="risk-chart-row" key={category.label}>
                <div className="risk-chart-label">
                  <span className={`category-index index-${index + 1}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{category.label}</span>
                  <strong>{category.count}</strong>
                </div>
                <div
                  className="bar-track"
                  role="img"
                  aria-label={`${category.label}: ${category.count} detections`}
                >
                  <div
                    className={`bar-fill bar-fill-${index + 1}`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="chart-footnote">
            <span className="legend-dot" />
            Detected risk instances
            <span className="chart-footnote-note">Sample data</span>
          </div>
        </section>

        <aside className="insight-card">
          <div className="insight-top">
            <span className="insight-icon">
              <Icon name="spark" size={21} />
            </span>
            <span className="insight-kicker">ADMIN INSIGHT</span>
          </div>

          <h2>Watch for recurring renewal patterns.</h2>
          <p>
            Automatic renewal is the leading category in this preview.
            These findings can help prioritize product improvements and
            future analysis quality checks.
          </p>

          <div className="insight-metric">
            <div>
              <span>Leading category</span>
              <strong>Automatic renewal</strong>
            </div>
            <strong className="insight-count">86</strong>
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
          subtitle="A quick look at recent contract analyses"
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
      </section>
    </>
  );
}

function UsersPage({ searchQuery }) {
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return demoUsers;

    return demoUsers.filter((user) =>
      [user.name, user.email, user.role, user.status].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  return (
    <>
      <div className="page-summary-row">
        <div className="summary-stat">
          <span className="summary-stat-icon">
            <Icon name="users" size={19} />
          </span>
          <div>
            <span>Users in this preview</span>
            <strong>{filteredUsers.length}</strong>
          </div>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-icon summary-stat-green">
            <Icon name="activity" size={19} />
          </span>
          <div>
            <span>Scans by listed users</span>
            <strong>
              {filteredUsers.reduce((total, user) => total + user.scans, 0)}
            </strong>
          </div>
        </div>
      </div>

      <section className="panel activity-panel">
        <SectionHeading
          title="Registered users"
          subtitle="Account directory and scan usage"
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
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Scan count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <Avatar initials={user.initials} />
                      <span className="user-copy">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`role-pill ${
                        user.role === 'Admin' ? 'role-admin' : 'role-user'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="date-cell">{user.joined}</td>
                  <td>
                    <strong className="table-number">{user.scans}</strong>
                  </td>
                  <td>
                    <span className="status-pill">
                      <span className="status-dot" />
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      No sample users match your search.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filteredUsers.length} sample users</span>
          <span>Live user data will be connected next</span>
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

  // Login first, then let /api/admin/me verify the account's role.
  const handleLogin = async (event) => {
    event.preventDefault();

    setAuthError('');
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
    setLoginPassword('');
    setSearchQuery('');
    setActivePage('overview');
  };

  const page = pageDetails[activePage] || pageDetails.overview;

  const navigateTo = (pageId) => {
    setActivePage(pageId);
    setSearchQuery('');
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
            UI preview
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
              UI PREVIEW
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
                  onChange={(event) => setSearchQuery(event.target.value)}
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
              <strong>Preview mode.</strong> The numbers and records shown here
              are sample data. The next checkpoint will connect this interface
              to the live, protected admin APIs.
            </p>
            <span className="demo-banner-tag">NOT LIVE DATA</span>
          </div>

          {activePage === 'overview' && (
            <OverviewPage
              searchQuery={searchQuery}
              onNavigate={navigateTo}
            />
          )}

          {activePage === 'users' && (
            <UsersPage searchQuery={searchQuery} />
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