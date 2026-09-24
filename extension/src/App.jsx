import { useEffect, useState } from 'react';
import './App.css';
import { login, getAuthToken, getScanHistory, logout } from './auth.js';

function App() {
  const [contractText, setContractText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();

      setIsAuthenticated(!!token);
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      setIsAuthenticated(true);
      setPassword('');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowHistory = async () => {
    setError('');
    setLoading(true);

    try {
      const scans = await getScanHistory();

      setScanHistory(scans);
      setShowHistory(true);
    } catch (err) {
      console.error('Scan history error:', err);
      setError(err.message || 'Failed to load scan history.');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapePage = async () => {
    try {
      // 1. Get the current active tab the user is looking at
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      setSourceUrl(tab.url || '');

      // 2. Inject a script into that tab to extract the text
      const injectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // This code runs inside the actual webpage, not the popup
          return document.body.innerText;
        },
      });

      // 3. Update the React text box with the scraped text (limited to 5000 chars for the AI)
      if (injectionResult && injectionResult[0] && injectionResult[0].result) {
        const scrapedText = injectionResult[0].result;
        setContractText(scrapedText.substring(0, 50000));
        setError('');
      }
    } catch (err) {
      console.error("Scraping error:", err);
      setError("Could not read this webpage. Chrome restricts scraping on certain system pages.");
    }
  };

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      setError('Please enter or paste contract text first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const token = await getAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setError('Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:5001/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contractText, sourceUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to analyze contract.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Could not connect to backend server. Make sure port 5001 is running.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ width: '380px', padding: '16px', fontFamily: 'sans-serif' }}>
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ width: '380px', padding: '16px', fontFamily: 'sans-serif' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>
          ClearContract AI
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
          Log in to analyze contracts and save your scan history.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid #ccc'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px',
              marginBottom: '12px',
              borderRadius: '6px',
              border: '1px solid #ccc'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: loading ? '#888' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '12px', color: '#dc2626', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (showHistory) {
    return (
      <div style={{ width: '380px', padding: '16px', fontFamily: 'sans-serif' }}>
        <button
          onClick={() => setShowHistory(false)}
          style={{
            marginBottom: '12px',
            padding: '6px 10px',
            backgroundColor: '#e5e7eb',
            color: '#1f2937',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to New Scan
        </button>

        <h2 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>
          Scan History
        </h2>

        {scanHistory.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#666' }}>
            No scans found yet.
          </p>
        ) : (
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {scanHistory.map((scan) => (
              <div
                key={scan._id}
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '12px',
                  textAlign: 'left'
                }}
              >
                <strong>
                  {scan.sourceUrl || 'Manual contract scan'}
                </strong>

                <p style={{ margin: '6px 0', color: '#666' }}>
                  {new Date(scan.scannedAt).toLocaleString()}
                </p>

                <p style={{ margin: '6px 0' }}>
                  {scan.aiSummary}
                </p>

                {scan.darkPatternsFound?.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>
                      Potential Risks: {scan.darkPatternsFound.length}
                    </strong>
                  </div>
                )}

                {scan.darkPatternsFound?.length === 0 && (
                  <div style={{ marginTop: '8px', color: '#166534' }}>
                    No meaningful risks identified.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '380px', padding: '16px', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>ClearContract AI</h2>
      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
        Paste any terms or contract clauses below to scan for hidden risks.
      </p>

      <button
        onClick={handleShowHistory}
        disabled={loading}
        style={{
          width: '100%',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#6b7280',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Loading History...' : 'Scan History'}
      </button>

      <button
        onClick={handleScrapePage}
        style={{
          width: '100%',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Read Current Webpage
      </button>

      <textarea
        rows="6"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '13px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
        placeholder="Paste legal text here..."
        value={contractText}
        onChange={(e) => setContractText(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '10px',
          backgroundColor: loading ? '#888' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Analyzing with Gemini...' : 'Analyze Contract'}
      </button>

      {error && (
        <div style={{ marginTop: '12px', color: '#dc2626', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '12px',
          maxHeight: '220px',
          overflowY: 'auto',
          textAlign: 'left'
        }}>
          <strong>Analysis Results:</strong>

          <div style={{ marginTop: '8px' }}>
            <strong>Summary</strong>
            <p>{analysis.aiSummary}</p>
          </div>

          {analysis.darkPatternsFound.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <strong>Potential Risks</strong>

              {analysis.darkPatternsFound.map((pattern, index) => (
                <div key={index} style={{ marginTop: '8px' }}>
                  <strong>{pattern.category}</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {pattern.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {analysis.darkPatternsFound.length === 0 && (
            <p style={{ marginTop: '8px' }}>
              No meaningful dark patterns or consumer risks were identified.
            </p>
          )}
        </div>
      )}

    </div>
  );
}

export default App;