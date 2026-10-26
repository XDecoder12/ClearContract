
function Navigation({ activeTab, setActiveTab }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    }}>
      <button
        onClick={() => setActiveTab('scanner')}
        style={{
          flex: 1,
          padding: '8px',
          backgroundColor:
            activeTab === 'scanner' ? '#2563eb' : '#e5e7eb',
          color:
            activeTab === 'scanner' ? 'white' : 'black',
          border: 'none',
          borderRadius: '6px'
        }}
      >
        Scanner
      </button>

      <button
        onClick={() => setActiveTab('history')}
        style={{
          flex: 1,
          padding: '8px',
          backgroundColor:
            activeTab === 'history' ? '#2563eb' : '#e5e7eb',
          color:
            activeTab === 'history' ? 'white' : 'black',
          border: 'none',
          borderRadius: '6px'
        }}
      >
        History
      </button>

      <button
        onClick={() => setActiveTab('account')}
        style={{
          flex: 1,
          padding: '8px',
          backgroundColor:
            activeTab === 'account' ? '#2563eb' : '#e5e7eb',
          color:
            activeTab === 'account' ? 'white' : 'black',
          border: 'none',
          borderRadius: '6px'
        }}
      >
        Account
      </button>
    </div>
  );
}

export default Navigation;
