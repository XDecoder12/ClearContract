
import { useState } from 'react';

function HistoryList({ scans, onDeleteScan }) {
  const [openScan, setOpenScan] = useState(null);
  const [deletingScanId, setDeletingScanId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async (scan) => {
    const confirmed = window.confirm(
      'Delete this scan permanently? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setDeleteError('');
    setDeletingScanId(scan._id);

    try {
      await onDeleteScan(scan._id);

      if (openScan === scan._id) {
        setOpenScan(null);
      }
    } catch (error) {
      setDeleteError(
        error.message || 'Could not delete the scan.'
      );
    } finally {
      setDeletingScanId(null);
    }
  };

  return (
    <div>
      {deleteError && (
        <p role="alert" style={{ color: '#dc2626' }}>
          {deleteError}
        </p>
      )}

      {scans.length === 0 && (
        <p>No scans found yet.</p>
      )}

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
              setOpenScan(
                openScan === scan._id ? null : scan._id
              );
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              overflowWrap: 'anywhere'
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
              {openScan === scan._id
                ? '▲ Hide Details'
                : '▼ Show Details'}
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

          <button
            type="button"
            disabled={deletingScanId !== null}
            onClick={() => handleDelete(scan)}
            style={{
              marginTop: '12px',
              padding: '7px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: deletingScanId !== null
                ? 'not-allowed'
                : 'pointer',
              opacity: deletingScanId !== null ? 0.6 : 1
            }}
          >
            {deletingScanId === scan._id
              ? 'Deleting...'
              : 'Delete Scan'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default HistoryList;
