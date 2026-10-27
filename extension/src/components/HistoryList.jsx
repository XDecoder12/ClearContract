
import { useState } from 'react';
import { exportAnalysisPdf } from '../utils/exportReport.js';

function HistoryList({ scans, onDeleteScan }) {
  const [openScan, setOpenScan] = useState(null);
  const [deletingScanId, setDeletingScanId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Search, filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Filter scans by search query and detected risks,
  // then sort by scan date.
  const filteredScans = scans
    .filter((scan) => {
      const query = searchQuery.trim().toLowerCase();

      const searchableText = [
        scan.sourceUrl || '',
        scan.aiSummary || '',
        ...(scan.darkPatternsFound || []).flatMap((pattern) => [
          pattern.category || '',
          pattern.explanation || ''
        ])
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const riskCount = scan.darkPatternsFound?.length || 0;

      const matchesRisk =
        riskFilter === 'all' ||
        (riskFilter === 'risky' && riskCount > 0) ||
        (riskFilter === 'safe' && riskCount === 0);

      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scannedAt).getTime();
      const dateB = new Date(b.scannedAt).getTime();

      return sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB;
    });

  // Delete a scan only after confirmation.
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
      {/* Search and filter controls */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search scans, websites or risks..."
          aria-label="Search scan history"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '9px',
            marginBottom: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '8px'
          }}
        >
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            aria-label="Filter scans by risk"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '7px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '12px'
            }}
          >
            <option value="all">All scans</option>
            <option value="risky">Risks detected</option>
            <option value="safe">No risks detected</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            aria-label="Sort scans by date"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '7px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '12px'
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Number of matching records */}
        <p
          style={{
            margin: '10px 0 0',
            fontSize: '11px',
            color: '#666'
          }}
        >
          Showing {filteredScans.length} of {scans.length} scans
        </p>
      </div>

      {/* Deletion error */}
      {deleteError && (
        <p
          role="alert"
          style={{
            color: '#dc2626',
            fontSize: '12px'
          }}
        >
          {deleteError}
        </p>
      )}

      {/* Empty history */}
      {scans.length === 0 && (
        <p>No scans found yet.</p>
      )}

      {/* No matching search results */}
      {scans.length > 0 && filteredScans.length === 0 && (
        <p
          style={{
            fontSize: '12px',
            color: '#666'
          }}
        >
          No scans match your search or filters.
        </p>
      )}

      {/* Scan history cards */}
      {filteredScans.map((scan) => (
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
          {/* Expand or collapse a scan */}
          <button
            type="button"
            onClick={() => {
              setOpenScan(
                openScan === scan._id ? null : scan._id
              );
            }}
            aria-expanded={openScan === scan._id}
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

          {/* Expanded analysis details */}
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

          {/* Delete button */}
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
              cursor:
                deletingScanId !== null
                  ? 'not-allowed'
                  : 'pointer',
              opacity: deletingScanId !== null ? 0.6 : 1
            }}
          >
            {deletingScanId === scan._id
              ? 'Deleting...'
              : 'Delete Scan'}
          </button>
          
<button
  type="button"
  onClick={async() => {
    try {
      setDeleteError('');

      exportAnalysisPdf({
        analysis: {
          aiSummary: scan.aiSummary,
          darkPatternsFound: scan.darkPatternsFound || []
        },
        sourceUrl: scan.sourceUrl,
        scannedAt: scan.scannedAt
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setDeleteError('Could not export the scan report.');
    }
  }}
  style={{
    marginTop: '12px',
    marginLeft: '8px',
    padding: '7px 12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }}
>
  Download PDF
</button>

        </div>
      ))}
    </div>
  );
}

export default HistoryList;
