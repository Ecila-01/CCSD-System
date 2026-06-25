import React, { useState } from 'react';
import { MdDownload } from "react-icons/md";
import { jsPDF } from 'jspdf';

/**
 * Generates a clean A4 PDF from plain data — no html2canvas screenshotting.
 *
 * Props:
 *   statsData  – { kpis, servicesTable, counselorTable?, weeks?, monthlyTrend }
 *   filename   – download filename (no .pdf)
 *   reportTitle – string shown in header
 *   generatedBy – staff name
 */
const PDFExportButton = ({ statsData, filename, reportTitle, generatedBy }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = () => {
    if (!statsData) return;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const PW = 210, PH = 297, M = 15, CW = PW - M * 2;
      let y = M;

      // ── page break guard ─────────────────────────────────────────────────
      const checkBreak = (need) => {
        if (y + need > PH - 18) { pdf.addPage(); y = M; footer(); }
      };

      // ── footer ───────────────────────────────────────────────────────────
      const footer = () => {
        const pg = pdf.internal.getCurrentPageInfo().pageNumber;
        pdf.setFontSize(7); pdf.setTextColor(148, 163, 184);
        pdf.text('University of Baguio — Center for Counseling and Student Development', M, PH - 8);
        pdf.text(`Page ${pg}`, PW - M, PH - 8, { align: 'right' });
      };

      // ── section heading ──────────────────────────────────────────────────
      const section = (title) => {
        checkBreak(14);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(30, 41, 59);
        pdf.text(title, M, y); y += 2;
        pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.4);
        pdf.line(M, y, M + CW, y); y += 5;
      };

      // ── table helper ─────────────────────────────────────────────────────
      const drawTable = (headers, rows, colW, headerColor, altColor) => {
        const ROW_H = 7;
        checkBreak(ROW_H + 4);
        // header
        pdf.setFillColor(...headerColor);
        pdf.rect(M, y, CW, ROW_H, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(255, 255, 255);
        let x = M;
        headers.forEach((h, i) => { pdf.text(h, x + 2, y + 5); x += colW[i]; });
        y += ROW_H;

        rows.forEach((row, ri) => {
          checkBreak(ROW_H);
          if (ri % 2 === 0) { pdf.setFillColor(...altColor); pdf.rect(M, y, CW, ROW_H, 'F'); }
          pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.2);
          pdf.line(M, y + ROW_H, M + CW, y + ROW_H);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
          x = M;
          row.forEach((cell, ci) => {
            // colour-code completed / pending / declined columns
            if (ci === 2) pdf.setTextColor(22, 163, 74);
            else if (ci === 3) pdf.setTextColor(245, 158, 11);
            else if (ci === 4) pdf.setTextColor(220, 38, 38);
            else pdf.setTextColor(51, 65, 85);
            pdf.text(String(cell), x + 2, y + 5);
            x += colW[ci];
          });
          y += ROW_H;
        });

        // totals row
        const numCols = rows[0]?.length ?? 0;
        if (numCols > 1) {
          checkBreak(ROW_H);
          pdf.setFillColor(30, 41, 59); pdf.rect(M, y, CW, ROW_H, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
          x = M;
          const totRow = rows.reduce((acc, row) => row.map((v, i) => i === 0 ? 'TOTAL' : (acc[i] !== 'TOTAL' && !isNaN(Number(v)) ? (Number(acc[i] || 0) + Number(v)) : acc[i])), []);
          // recalculate rate for totals
          if (totRow.length >= 6) {
            const tot = Number(totRow[1]) || 0;
            const comp = Number(totRow[2]) || 0;
            totRow[5] = tot > 0 ? `${Math.round((comp / tot) * 100)}%` : '0%';
          }
          totRow.forEach((cell, ci) => { pdf.text(String(cell), x + 2, y + 5); x += colW[ci]; });
          y += ROW_H;
        }
        y += 6;
      };

      // ════════════════════════════════════════════════════════════════════
      // HEADER
      // ════════════════════════════════════════════════════════════════════
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
      pdf.setTextColor(192, 0, 0); pdf.text('UB CCSD', M, y + 5); y += 9;

      pdf.setFontSize(13); pdf.setTextColor(30, 41, 59);
      pdf.text(reportTitle || 'Statistics Report', M, y); y += 6;

      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
      pdf.text(`Prepared by: ${generatedBy || 'Staff'}`, M, y); y += 5;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, M, y); y += 7;

      pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.5);
      pdf.line(M, y, PW - M, y); y += 8;

      // ════════════════════════════════════════════════════════════════════
      // KPI CARDS
      // ════════════════════════════════════════════════════════════════════
      if (statsData.kpis?.length) {
        const kpis = statsData.kpis;
        const n = kpis.length;
        const CARD_W = CW / n;
        const CARD_H = 22;
        const COLORS = [
          [25,118,210],[22,163,74],[245,158,11],[220,38,38],[124,58,237],[8,145,178]
        ];
        kpis.forEach((kpi, i) => {
          const cx = M + i * CARD_W;
          const [r,g,b] = COLORS[i % COLORS.length];
          pdf.setFillColor(r,g,b); pdf.rect(cx + 0.5, y, CARD_W - 1, 1.5, 'F');
          pdf.setFillColor(255,255,255); pdf.rect(cx + 0.5, y + 1.5, CARD_W - 1, CARD_H - 1.5, 'F');
          pdf.setDrawColor(226,232,240); pdf.rect(cx + 0.5, y, CARD_W - 1, CARD_H, 'S');
          pdf.setFont('helvetica','normal'); pdf.setFontSize(5.5); pdf.setTextColor(100,116,139);
          pdf.text(kpi.label, cx + 3, y + 8);
          pdf.setFont('helvetica','bold'); pdf.setFontSize(15); pdf.setTextColor(r,g,b);
          pdf.text(String(kpi.value), cx + 3, y + 18);
        });
        y += CARD_H + 8;
      }

      // ════════════════════════════════════════════════════════════════════
      // MONTHLY TREND BAR CHART
      // ════════════════════════════════════════════════════════════════════
      if (statsData.monthlyTrend?.length) {
        section('Monthly Volume');
        const data = statsData.monthlyTrend;
        const CH = 48;
        const maxVal = Math.max(...data.map(d => (d.completed||0)+(d.pending||0)+(d.declined||0)), 1);
        const gW = CW / data.length;
        const bW = Math.min(gW * 0.55 / 3, 4);
        const BAR_COLORS = [[22,163,74],[220,38,38],[245,158,11]];
        const TYPES = ['completed','declined','pending'];

        pdf.setFillColor(248,250,252); pdf.rect(M, y, CW, CH, 'F');
        pdf.setDrawColor(226,232,240); pdf.rect(M, y, CW, CH, 'S');

        // gridlines
        [0.25,0.5,0.75,1].forEach(p => {
          const ly = y + CH - 4 - p*(CH-10);
          pdf.setDrawColor(226,232,240); pdf.setLineWidth(0.15);
          pdf.line(M+1, ly, M+CW-1, ly);
          pdf.setFontSize(4.5); pdf.setTextColor(148,163,184);
          pdf.text(String(Math.round(p*maxVal)), M-1, ly+1, { align:'right' });
        });

        data.forEach((d, i) => {
          const gx = M + i*gW + gW*0.2;
          TYPES.forEach((type, ti) => {
            const val = d[type]||0; if (!val) return;
            const bh = (val/maxVal)*(CH-10);
            pdf.setFillColor(...BAR_COLORS[ti]);
            pdf.rect(gx + ti*(bW+1), y+CH-4-bh, bW, bh, 'F');
          });
          pdf.setFontSize(5); pdf.setTextColor(100,116,139);
          pdf.text(d.month||'', M + i*gW + gW/2, y+CH+3.5, { align:'center' });
        });

        // legend
        const ly = y + CH + 7;
        [['Completed',[22,163,74]],['Declined',[220,38,38]],['Pending',[245,158,11]]].forEach(([lbl,[r,g,b]],i) => {
          const lx = M + i*42;
          pdf.setFillColor(r,g,b); pdf.rect(lx, ly-2.5, 3.5, 3, 'F');
          pdf.setFontSize(6); pdf.setTextColor(71,85,105); pdf.text(lbl, lx+5, ly);
        });
        y += CH + 14;
      }

      // ════════════════════════════════════════════════════════════════════
      // SERVICES SUMMARY TABLE
      // ════════════════════════════════════════════════════════════════════
      if (statsData.servicesTable?.length) {
        checkBreak(20);
        section('Services Summary');
        const colW = [68,18,28,22,24,20];
        const rows = statsData.servicesTable.map(r => [
          r.service, r.total, r.completed, r.pending, r.declined,
          `${r.total>0?Math.round((r.completed/r.total)*100):0}%`
        ]);
        drawTable(
          ['SERVICE','TOTAL','COMPLETED','PENDING','DECLINED','RATE'],
          rows, colW, [192,0,0], [248,250,252]
        );
      }

      // ════════════════════════════════════════════════════════════════════
      // COUNSELOR TABLE (overall report)
      // ════════════════════════════════════════════════════════════════════
      if (statsData.counselorTable?.length) {
        checkBreak(20);
        section('Counselor Performance');
        const colW = [68,18,28,22,24,20];
        const rows = statsData.counselorTable.map(r => [
          r.name, r.total, r.completed, r.pending, r.declined,
          `${r.total>0?Math.round((r.completed/r.total)*100):0}%`
        ]);
        drawTable(
          ['COUNSELOR','TOTAL','COMPLETED','PENDING','DECLINED','RATE'],
          rows, colW, [25,118,210], [239,246,255]
        );
      }

      // ════════════════════════════════════════════════════════════════════
      // WEEKLY BREAKDOWN (accomplishment report)
      // ════════════════════════════════════════════════════════════════════
      if (statsData.weeks?.length) {
        checkBreak(20);
        section('Weekly Breakdown');
        const colW = [38,36,36,36,34];
        const rows = statsData.weeks.map(r => {
          const tot = (r.completed||0)+(r.pending||0)+(r.declined||0);
          return [r.name, r.completed||0, r.pending||0, r.declined||0, tot];
        });
        drawTable(
          ['WEEK','COMPLETED','PENDING','DECLINED','TOTAL'],
          rows, colW, [124,58,237], [250,245,255]
        );
      }

      footer();

      const url = URL.createObjectURL(pdf.output('blob'));
      const w = window.open(url, '_blank');
      if (!w) alert('Please allow pop-ups to view the PDF.');
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        backgroundColor: isGenerating ? '#94a3b8' : '#c00000',
        color: 'white', padding: '10px 20px', border: 'none',
        fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer',
        borderRadius: '6px', fontSize: '13px',
      }}
    >
      <MdDownload size={18} />
      {isGenerating ? 'Generating…' : 'Download Statistics PDF'}
    </button>
  );
};

export default PDFExportButton;
