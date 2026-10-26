import { useEffect, useState } from 'react';
import './App.css';
import Footer from './components/Footer';

import {
  login,
  getAuthToken,
  getScanHistory,
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

  // Saved scans and navigation
  const [scanHistory, setScanHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner');

  const isBusy =
    isLoggingIn ||
    isLoadingHistory ||
    isScraping ||
    isAnalyzing;

  // Check saved authentication when popup opens
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

  // Handle user login
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

  // Handle user logout
  const handleLogout = async () => {
    if (isBusy) return;

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

  // Fetch previously saved scans
  const handleShowHistory = async () => {
    if (isLoadingHistory) return;

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

  // Switch between Scanner, History and Account
  const handleTabChange = (tab) => {
    if (tab === 'history') {
      handleShowHistory();
    } else {
      setActiveTab(tab);
      setError('');
    }
  };

  // Read text from the current webpage
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

      const injectionResult =
        await chrome.scripting.executeScript({
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

  // Analyze contract through the backend Gemini API
  const handleAnalyze = async () => {
    if (isScraping || isAnalyzing) return;

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

        setError(
          'Your session has expired. Please log in again.'
        );
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

  // Show loading screen while checking authentication
  if (checkingAuth) {
    return (
      <div className="app-container">
        <p>Checking authentication...</p>
        <Footer />
      </div>
    );
  }

  // Show Login or Register for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        {authScreen === 'register' ? (
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
        ) : (
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
        )}

        <Footer />
      </div>
    );
  }

  // Main authenticated extension interface
  return (
    <div className="app-container">
      <h2 className="app-title">ClearContract AI</h2>

      {/* Three-tab navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Scanner tab */}
      {activeTab === 'scanner' && (
        <div>
          <p className="app-description">
            Paste any terms or contract clauses below to scan
            for hidden risks.
          </p>

          <button
            onClick={handleScrapePage}
            disabled={isScraping || isAnalyzing}
            className="app-button scrape-button"
          >
            {isScraping
              ? 'Reading Webpage...'
              : 'Read Current Webpage'}
          </button>

          <textarea
            rows="6"
            maxLength={MAX_CONTRACT_CHARS}
            placeholder="Paste legal text here..."
            value={contractText}
            onChange={(event) => {
              setContractText(event.target.value);
              setSourceUrl('');
              setAnalysis(null);
            }}
            className="contract-textarea"
          />

          <div className="character-count">
            {contractText.length.toLocaleString()} /{' '}
            {MAX_CONTRACT_CHARS.toLocaleString()} characters
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isScraping}
            className="app-button analyze-button"
          >
            {isAnalyzing
              ? 'Analyzing with Gemini...'
              : 'Analyze Contract'}
          </button>

          {error && (
            <p className="error-message">{error}</p>
          )}

          {/* Gemini analysis results */}
          {analysis && (
            <div className="analysis-output">
              <strong>Analysis Results:</strong>

              <div>
                <strong>Summary</strong>
                <p>{analysis.aiSummary}</p>
              </div>

              {analysis.darkPatternsFound?.length > 0 ? (
                <div>
                  <strong>Potential Risks</strong>

                  {analysis.darkPatternsFound.map(
                    (pattern, index) => (
                      <div key={index} className="risk-item">
                        <strong>{pattern.category}</strong>
                        <p>{pattern.explanation}</p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p>
                  No meaningful dark patterns or consumer risks
                  were identified.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div>
          <h3>Scan History</h3>

          {isLoadingHistory ? (
            <p>Loading your scan history...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="history-list">
              <HistoryList scans={scanHistory} />
            </div>
          )}
        </div>
      )}

      {/* Account tab */}
      {activeTab === 'account' && (
        <div>
          <h3>My Account</h3>

          <p>You are currently logged in to ClearContract.</p>
          <p>Your scan history is saved to your account.</p>

          <button
            onClick={handleLogout}
            disabled={isBusy}
            className="app-button logout-button"
          >
            Log Out
          </button>

          {error && (
            <p className="error-message">{error}</p>
          )}
        </div>
      )}

      {/* Footer from styling/ui-branding */}
      <Footer />
    </div>
  );
}

export default App;