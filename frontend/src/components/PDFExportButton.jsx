import React, { useState } from 'react';
import { MdDownload } from "react-icons/md";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PDFExportButton = ({ targetRef, filename, reportTitle, generatedBy }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!targetRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1280,
        width: 1280,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth  = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight();  // 297mm
      const margin = 15;
      const contentWidth = pdfWidth - margin * 2;

      // ── Header (drawn on first page only) ──────────────────────────────────
      const drawHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(192, 0, 0);
        pdf.text('UB CCSD', margin, 18);

        pdf.setFontSize(13);
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportTitle || 'Statistics Report', margin, 26);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Prepared by: ${generatedBy || 'Staff'}`, margin, 33);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 38);

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 42, pdfWidth - margin, 42);
      };

      // ── Footer ──────────────────────────────────────────────────────────────
      const drawFooter = (pageNum, totalPages) => {
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          'University of Baguio — Center for Counseling and Student Development',
          margin,
          pdfHeight - 8
        );
        pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - margin, pdfHeight - 8, { align: 'right' });
      };

      // ── Slice canvas into pages ─────────────────────────────────────────────
      const headerHeight = 48;       // mm used by header on page 1
      const footerHeight = 12;       // mm reserved at bottom for footer
      const contentAreaFull = pdfHeight - footerHeight;          // page 1: below header
      const contentAreaRest = pdfHeight - footerHeight;          // subsequent pages

      // Convert mm to canvas pixels
      const mmToPx = (mm) => (mm * canvas.width) / contentWidth;

      const firstPageContentMm  = pdfHeight - headerHeight - footerHeight;
      const otherPageContentMm  = pdfHeight - margin - footerHeight;

      const firstPagePx = mmToPx(firstPageContentMm);
      const otherPagePx = mmToPx(otherPageContentMm);

      // Figure out total pages needed
      const remainingPx = Math.max(0, canvas.height - firstPagePx);
      const extraPages  = remainingPx > 0 ? Math.ceil(remainingPx / otherPagePx) : 0;
      const totalPages  = 1 + extraPages;

      // Page 1
      drawHeader();
      const sliceH1 = Math.min(firstPagePx, canvas.height);
      const pageCanvas1 = document.createElement('canvas');
      pageCanvas1.width  = canvas.width;
      pageCanvas1.height = sliceH1;
      pageCanvas1.getContext('2d').drawImage(canvas, 0, 0, canvas.width, sliceH1, 0, 0, canvas.width, sliceH1);
      pdf.addImage(pageCanvas1.toDataURL('image/png'), 'PNG', margin, headerHeight, contentWidth, firstPageContentMm);
      drawFooter(1, totalPages);

      // Extra pages
      let offsetPx = firstPagePx;
      for (let p = 2; p <= totalPages; p++) {
        pdf.addPage();
        const sliceH = Math.min(otherPagePx, canvas.height - offsetPx);
        const pc = document.createElement('canvas');
        pc.width  = canvas.width;
        pc.height = sliceH;
        pc.getContext('2d').drawImage(canvas, 0, offsetPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        pdf.addImage(pc.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, otherPageContentMm);
        drawFooter(p, totalPages);
        offsetPx += sliceH;
      }

      const pdfBlob = pdf.output('blob');
      const pdfUrl  = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      if (!newWindow) alert('Please allow pop-ups to view the generated PDF.');

    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('An error occurred while generating the PDF.');
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
        transition: 'background-color 0.2s',
      }}
    >
      <MdDownload size={18} />
      {isGenerating ? 'Generating…' : 'Download Statistics PDF'}
    </button>
  );
};

export default PDFExportButton;
