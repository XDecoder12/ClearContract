
export const exportAnalysisPdf = async ({
  analysis,
  sourceUrl = '',
  scannedAt = null
}) => {
  if (!analysis || !Array.isArray(analysis.darkPatternsFound)) {
    throw new Error('No valid analysis is available to export.');
  }

  // Load jsPDF only when the report is requested.
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 18;
  const usableWidth = pageWidth - margin * 2;

  let y = 22;

  // Add a new page when insufficient vertical space remains.
  const checkPage = (requiredHeight = 12) => {
    if (y + requiredHeight > pageHeight - 20) {
      doc.addPage();
      y = 22;
    }
  };

  // Write wrapped text, supporting automatic page breaks.
  const writeText = (value, options = {}) => {
    const {
      size = 10,
      bold = false,
      spacing = 5
    } = options;

    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(
      String(value ?? ''),
      usableWidth
    );

    const lineHeight = size * 0.43;

    for (const line of lines) {
      checkPage(lineHeight + 2);

      doc.text(line, margin, y);

      y += lineHeight;
    }

    y += spacing;
  };

  // Main report heading
  writeText('ClearContract AI', {
    size: 19,
    bold: true,
    spacing: 4
  });

  writeText('Contract Analysis Report', {
    size: 13,
    bold: true,
    spacing: 8
  });

  // Report generation timestamp
  const generatedAt = new Date().toLocaleString('en-IN');

  writeText(`Report generated: ${generatedAt}`, {
    size: 9,
    spacing: 3
  });

  // Original scan timestamp, when provided.
  if (scannedAt) {
    const scanDate = new Date(scannedAt);

    if (!Number.isNaN(scanDate.getTime())) {
      writeText(
        `Originally scanned: ${scanDate.toLocaleString('en-IN')}`,
        {
          size: 9,
          spacing: 3
        }
      );
    }
  }

  // Contract source
  writeText(
    `Source: ${sourceUrl || 'Manual contract scan'}`,
    {
      size: 9,
      spacing: 10
    }
  );

  // Overall risk level (optional for older scans).
  if (analysis.overallRiskLevel) {
    writeText(
      `OVERALL RISK LEVEL: ${analysis.overallRiskLevel}`,
      {
        size: 11,
        bold: true,
        spacing: 8
      }
    );
  }

  // AI-generated summary
  writeText('AI SUMMARY', {
    size: 12,
    bold: true,
    spacing: 5
  });

  writeText(
    analysis.aiSummary || 'No summary available.',
    {
      spacing: 10
    }
  );

  // Risks identified by Gemini.
  const risks = analysis.darkPatternsFound;

  writeText(`POTENTIAL RISKS (${risks.length})`, {
    size: 12,
    bold: true,
    spacing: 6
  });

  if (risks.length === 0) {
    writeText(
      'No meaningful risks were identified by the analysis.',
      {
        spacing: 10
      }
    );
  } else {
    risks.forEach((risk, index) => {
      // Risk category
      writeText(
        `${index + 1}. ${risk.category || 'Uncategorized risk'}`,
        {
          size: 11,
          bold: true,
          spacing: 3
        }
      );

      // Explanation
      writeText(
        risk.explanation || 'No explanation provided.',
        {
          spacing: 5
        }
      );

      // Individual risk severity
      if (risk.severity) {
        writeText(
          `Severity: ${risk.severity}`,
          {
            size: 10,
            spacing: 5
          }
        );
      }

      // Exact supporting contract quotation
      if (risk.evidence) {
        writeText(
          `Supporting evidence: "${risk.evidence}"`,
          {
            size: 9,
            spacing: 10
          }
        );
      } else {
        // Maintain spacing for legacy reports.
        y += 3;
      }
    });
  }

  // Informational disclaimer
  y += 5;

  checkPage(25);

  writeText('IMPORTANT NOTE', {
    size: 10,
    bold: true,
    spacing: 4
  });

  writeText(
    'This report contains automated AI-generated observations. ' +
    'It is informational and does not constitute legal advice. ' +
    'A lack of flagged risks does not guarantee that a contract is safe.',
    {
      size: 9
    }
  );

  // Add page numbers to every generated page.
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);

    doc.text(
      `ClearContract AI | Page ${page} of ${totalPages}`,
      margin,
      pageHeight - 10
    );
  }

  // Download a dated PDF report.
  const date = new Date().toISOString().slice(0, 10);

  doc.save(`ClearContract-Report-${date}.pdf`);
};
