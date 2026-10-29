
import { useEffect, useState } from 'react';
import './App.css';

import { exportAnalysisPdf } from './utils/exportReport.js';

import {
  login,
  getAuthToken,
  getScanHistory,
  deleteScan,
  logout
} from './auth.js';

import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Navigation from './components/Navigation.jsx';
import HistoryList from './components/HistoryList.jsx';

const MAX_CONTRACT_CHARS = 200000;

function App() {
  // Contract scanner state
  const [contractText, setContractText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);

  // Loading states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Error messages
  const [error, setError] = useState('');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login and registration screens
  const [authScreen, setAuthScreen] = useState('login');
  const [authMessage, setAuthMessage] = useState('');

  // Login form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Saved scans
  const [scanHistory, setScanHistory] = useState([]);

  // Popup navigation
  const [activeTab, setActiveTab] = useState('scanner');

  const isBusy =
    isLoggingIn ||
    isLoadingHistory ||
    isScraping ||
    isAnalyzing;

  // Check saved authentication when popup opens.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        setIsAuthenticated(!!token);
      } catch (err) {
        console.error('Authentication check error:', err);
        setIsAuthenticated(false);
        setError('Could not check your login status.');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle user login.
  const handleLogin = async (event) => {
    event.preventDefault();

    setError('');
    setAuthMessage('');
    setIsLoggingIn(true);

    try {
      await login(email, password);

      setIsAuthenticated(true);
      setActiveTab('scanner');
      setPassword('');
      setError('');
    } catch (err) {
      console.error('Login error:', err);

      if (err instanceof TypeError) {
        setError('Cannot connect to the server. Please try again.');
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle user logout.
  const handleLogout = async () => {
    if (isBusy) {
      return;
    }

    try {
      await logout();

      setIsAuthenticated(false);
      setAuthScreen('login');
      setActiveTab('scanner');

      setEmail('');
      setPassword('');
      setScanHistory([]);
      setContractText('');
      setSourceUrl('');
      setAnalysis(null);

      setError('');
      setAuthMessage('');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Could not log out. Please try again.');
    }
  };

  // Fetch previously saved scans.
  const handleShowHistory = async () => {
    if (isLoadingHistory) {
      return;
    }

    setError('');
    setActiveTab('history');
    setIsLoadingHistory(true);

    try {
      const scans = await getScanHistory();
      setScanHistory(scans);
    } catch (err) {
      console.error('Scan history error:', err);

      if (
        err.message ===
        'Your session has expired. Please log in again.'
      ) {
        setIsAuthenticated(false);
        setAuthScreen('login');
        setActiveTab('scanner');

        setScanHistory([]);
        setContractText('');
        setSourceUrl('');
        setAnalysis(null);
      }

      setError(err.message || 'Failed to load scan history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Delete a saved scan.
  const handleDeleteScan = async (scanId) => {
    try {
      await deleteScan(scanId);

      // Update history immediately after successful deletion.
      setScanHistory((previousScans) =>
        previousScans.filter((scan) => scan._id !== scanId)
      );
    } catch (err) {
      if (
        err.message ===
        'Your session has expired. Please log in again.'
      ) {
        setIsAuthenticated(false);
        setAuthScreen('login');
        setActiveTab('scanner');

        setScanHistory([]);
        setContractText('');
        setSourceUrl('');
        setAnalysis(null);
      }

      throw err;
    }
  };

  // Switch between Scanner, History and Account.
  const handleTabChange = (tab) => {
    if (tab === 'history') {
      handleShowHistory();
    } else {
      setActiveTab(tab);
      setError('');
    }
  };

  // Read text from the current webpage.
  const handleScrapePage = async () => {
    setError('');
    setIsScraping(true);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tab?.id) {
        throw new Error('Could not determine the current webpage.');
      }

      const injectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body?.innerText || ''
      });

      const scrapedText = injectionResult?.[0]?.result;

      if (
        typeof scrapedText !== 'string' ||
        !scrapedText.trim()
      ) {
        setContractText('');
        setSourceUrl('');
        setAnalysis(null);

        setError('No readable text was found on this webpage.');
        return;
      }

      setContractText(
        scrapedText.substring(0, MAX_CONTRACT_CHARS)
      );

      setSourceUrl(
        typeof tab.url === 'string' &&
        /^https?:\/\//i.test(tab.url)
          ? tab.url
          : ''
      );

      setAnalysis(null);
      setError('');
    } catch (err) {
      console.error('Scraping error:', err);

      setContractText('');
      setSourceUrl('');
      setAnalysis(null);

      setError(
        'Could not read this webpage. Chrome restricts scraping on certain system pages.'
      );
    } finally {
      setIsScraping(false);
    }
  };

  // Analyze contract through the backend Gemini API.
  const handleAnalyze = async () => {
    if (isScraping || isAnalyzing) {
      return;
    }

    if (!contractText.trim()) {
      setError('Please enter or paste contract text first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setAuthScreen('login');
        setError('Please log in again.');
        return;
      }

      const response = await fetch(
        'http://localhost:5001/api/ai/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            contractText,
            sourceUrl
          })
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        await logout();

        setIsAuthenticated(false);
        setAuthScreen('login');
        setActiveTab('scanner');

        setScanHistory([]);
        setContractText('');
        setSourceUrl('');
        setAnalysis(null);

        setError('Your session has expired. Please log in again.');
        return;
      }

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to analyze contract.');
      }
    } catch (err) {
      console.error('Analysis error:', err);

      setError(
        'Could not connect to backend server. Make sure port 5001 is running.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show loading screen while checking authentication.
  if (checkingAuth) {
    return (
      <div
        className="app-container"
        style={{
          width: '380px',
          padding: '16px',
          fontFamily: 'sans-serif'
        }}
      >
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Show Login or Register for unauthenticated users.
  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return (
        <div
          className="app-container"
          style={{ width: '380px' }}
        >
          <Register
            onRegistered={() => {
              setAuthMessage(
                'Registration successful! Please log in.'
              );
              setError('');
              setAuthScreen('login');
            }}
            onBackToLogin={() => {
              setError('');
              setAuthScreen('login');
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="app-container"
        style={{ width: '380px' }}
      >
        <Login
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          handleLogin={handleLogin}
          isLoggingIn={isLoggingIn}
          error={error}
          authMessage={authMessage}
          onShowRegister={() => {
            setAuthMessage('');
            setError('');
            setAuthScreen('register');
          }}
        />
      </div>
    );
  }

  // Main authenticated extension interface.
  return (
    <div
      className="app-container"
      style={{
        width: '380px',
        padding: '16px',
        fontFamily: 'sans-serif',
        boxSizing: 'border-box'
      }}
    >
      <h2
        style={{
          margin: '0 0 12px 0',
          color: '#1a1a1a'
        }}
      >
        ClearContract AI
      </h2>

      {/* Three-tab navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* SCANNER TAB */}
      {activeTab === 'scanner' && (
        <div>
          <p
            className="app-description"
            style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              color: '#666'
            }}
          >
            Paste any terms or contract clauses below to scan
            for hidden risks.
          </p>

          <button
            className="scrape-button"
            onClick={handleScrapePage}
            disabled={isScraping || isAnalyzing}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '12px',
              backgroundColor: isScraping
                ? '#9ca3af'
                : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: isScraping
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            {isScraping
              ? 'Reading Webpage...'
              : 'Read Current Webpage'}
          </button>

          <textarea
            className="contract-textarea"
            rows="6"
            maxLength={MAX_CONTRACT_CHARS}
            placeholder="Paste legal text here..."
            value={contractText}
            onChange={(event) => {
              setContractText(event.target.value);
              setSourceUrl('');
              setAnalysis(null);
            }}
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
          />

          <div
            className="character-count"
            style={{
              marginTop: '6px',
              marginBottom: '12px',
              fontSize: '11px',
              color:
                contractText.length >= MAX_CONTRACT_CHARS
                  ? '#dc2626'
                  : '#666',
              textAlign: 'right'
            }}
          >
            {contractText.length.toLocaleString()} /{' '}
            {MAX_CONTRACT_CHARS.toLocaleString()} characters
          </div>

          <button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || isScraping}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              backgroundColor: isAnalyzing
                ? '#888'
                : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor:
                isAnalyzing || isScraping
                  ? 'not-allowed'
                  : 'pointer'
            }}
          >
            {isAnalyzing
              ? 'Analyzing with Gemini...'
              : 'Analyze Contract'}
          </button>

          {error && (
            <p
              className="error-message"
              style={{
                color: '#dc2626',
                fontSize: '12px',
                marginTop: '12px'
              }}
            >
              {error}
            </p>
          )}

          {/* Gemini analysis results */}
          {analysis && (
            <div
              className="analysis-output"
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '220px',
                overflowY: 'auto',
                textAlign: 'left'
              }}
            >
              <strong>Analysis Results:</strong>
              {analysis.overallRiskLevel && (
              <p style={{ marginTop: '10px', fontSize: '12px' }}>
                <strong>Overall Risk Level: </strong>
                {analysis.overallRiskLevel}
              </p>
            )}

              {/* Export the current analysis as a PDF */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await exportAnalysisPdf({
                      analysis,
                      sourceUrl
                    });
                  } catch (err) {
                    console.error('PDF export error:', err);
                    setError(
                      'Could not export the analysis report.'
                    );
                  }
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '10px',
                  padding: '9px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Download PDF Report
              </button>

              <div
                className="analysis-summary"
                style={{ marginTop: '12px' }}
              >
                <strong>Summary</strong>
                <p>{analysis.aiSummary}</p>
              </div>

              {analysis.darkPatternsFound.length > 0 && (
                <div className="potential-risks">
                  <strong>Potential Risks</strong>

                  {analysis.darkPatternsFound.map(
                    (pattern, index) => (
                      <div
                        className="risk-item"
                        key={index}
                        style={{ marginTop: '8px' }}
                      >
                        <strong>{pattern.category}</strong>

                        <p style={{ margin: '4px 0 0 0' }}>
                          {pattern.explanation}
                        </p>
                        {pattern.severity && (
                        <p style={{ marginTop: '6px' }}>
                          <strong>Severity:</strong> {pattern.severity}
                        </p>
                      )}

                      {pattern.evidence && (
                        <p style={{ marginTop: '6px', overflowWrap: 'anywhere' }}>
                          <strong>Supporting Evidence:</strong> "{pattern.evidence}"
                        </p>
                      )}
                      </div>
                    )
                  )}
                </div>
              )}

              {analysis.darkPatternsFound.length === 0 && (
                <p className="no-risks">
                  No meaningful dark patterns or consumer risks
                  were identified.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          <h3
            style={{
              margin: '0 0 12px 0',
              color: '#1a1a1a'
            }}
          >
            Scan History
          </h3>

          {isLoadingHistory ? (
            <p style={{ fontSize: '13px', color: '#666' }}>
              Loading your scan history...
            </p>
          ) : error ? (
            <p className="error-message">
              {error}
            </p>
          ) : (
            <div
              className="history-list"
              style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <HistoryList
                scans={scanHistory}
                onDeleteScan={handleDeleteScan}
              />
            </div>
          )}
        </div>
      )}

      {/* ACCOUNT TAB */}
      {activeTab === 'account' && (
        <div>
          <h3
            style={{
              margin: '0 0 12px 0',
              color: '#1a1a1a'
            }}
          >
            My Account
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: '#666'
            }}
          >
            You are currently logged in to ClearContract.
          </p>

          <p
            style={{
              fontSize: '12px',
              color: '#666'
            }}
          >
            Your scan history is saved to your account.
          </p>

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={isBusy}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              backgroundColor: isBusy
                ? '#9ca3af'
                : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: isBusy
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            Log Out
          </button>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
