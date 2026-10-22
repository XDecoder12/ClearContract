
import { useState } from 'react';

function HistoryList({ scans }) {
  const [openScan, setOpenScan] = useState(null);

  if (scans.length === 0) {
    return <p>No scans found yet.</p>;
  }

  return (
    <div>
      {scans.map((scan) => (
        <div
          key={scan._id}
          style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (openScan === scan._id) {
                setOpenScan(null);
              } else {
                setOpenScan(scan._id);
              }
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0'
            }}
          >
            <strong>
              {scan.sourceUrl || 'Manual contract scan'}
            </strong>

            <p style={{ color: '#666' }}>
              {new Date(scan.scannedAt).toLocaleString()}
            </p>

            <p>
              Potential Risks: {scan.darkPatternsFound?.length || 0}
            </p>

            <span>
              {openScan === scan._id ? '▲ Hide Details' : '▼ Show Details'}
            </span>
          </button>

          {openScan === scan._id && (
            <div style={{ marginTop: '12px' }}>
              <strong>AI Summary</strong>
              <p>{scan.aiSummary}</p>

              {scan.darkPatternsFound?.length > 0 ? (
                <div>
                  <strong>Flagged Risks</strong>

                  {scan.darkPatternsFound.map((pattern, index) => (
                    <div
                      key={index}
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px'
                      }}
                    >
                      <strong>{pattern.category}</strong>
                      <p>{pattern.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No meaningful risks identified.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default HistoryList;
