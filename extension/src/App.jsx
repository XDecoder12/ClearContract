import { useState } from 'react';
import './App.css';

function App() {
  const [contractText, setContractText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      setError('Please enter or paste contract text first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const response = await fetch('http://localhost:5001/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractText }),
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

  return (
    <div style={{ width: '380px', padding: '16px', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>🛡️ ClearContract AI</h2>
      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
        Paste any terms or contract clauses below to scan for hidden risks.
      </p>

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
          textAlign: 'left',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Analysis Results:</strong>
          <div style={{ marginTop: '8px' }}>{analysis}</div>
        </div>
      )}
    </div>
  );
}

export default App;