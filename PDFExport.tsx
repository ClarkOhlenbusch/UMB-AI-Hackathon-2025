import React from 'react';
import jsPDF from 'jspdf';
import { DownloadIcon } from './components/Icons';
import { AnalysisResult } from './types';

interface PDFExportButtonProps {
  analysisResult: AnalysisResult | null;
  fileName: string;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  analysisResult,
  fileName,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleExport = () => {
    if (!analysisResult || isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;

      // --- Helper for Section Titles ---
      const drawSectionTitle = (title: string) => {
        if (y + 20 > pageHeight - margin) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(title, margin, y);
        y += 6;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      };

      // --- Document Title ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Distress Analysis Report', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, y, { align: 'center' });
      y += 15;
      doc.setTextColor(0);

      // --- Safety Flag ---
      if (analysisResult.safety_flag) {
        if (y + 30 > pageHeight - margin) { doc.addPage(); y = 20; }
        const startY = y;
        doc.setFillColor(254, 226, 226); // red-100
        doc.setDrawColor(220, 38, 38); // red-600
        doc.setLineWidth(0.5);
        
        doc.setTextColor(153, 27, 27); // red-800
        doc.setFont('helvetica', 'bold');
        const warningTitle = 'SAFETY FLAG RAISED';
        doc.setFontSize(11);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28); // red-700
        const warningLines = doc.splitTextToSize('Crisis or self-harm risk cues detected. Please follow appropriate safety protocols.', maxWidth - 10);
        
        const rectHeight = 10 + warningLines.length * 4.5 + 5;
        doc.rect(margin, startY, maxWidth, rectHeight, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(153, 27, 27);
        doc.text(warningTitle, margin + 5, startY + 7);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28);
        doc.text(warningLines, margin + 5, startY + 14);

        y = startY + rectHeight + 10;
        doc.setTextColor(0);
      }

      // --- Summary Section ---
      drawSectionTitle('Analysis Summary');

      const levelStyles: { [key: string]: { bg: [number, number, number]; text: [number, number, number]; } } = {
        none: { bg: [209, 250, 229], text: [21, 94, 53] },
        low: { bg: [204, 251, 241], text: [13, 94, 83] },
        medium: { bg: [254, 249, 195], text: [146, 64, 14] },
        high: { bg: [254, 226, 226], text: [153, 27, 27] },
      };
      const style = levelStyles[analysisResult.distress_level];
      const levelText = analysisResult.distress_level.toUpperCase();
      const levelTextWidth = doc.getTextWidth(levelText) * 0.5; // Estimate width
      
      doc.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      doc.roundedRect(margin, y, levelTextWidth + 15, 8, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(style.text[0], style.text[1], style.text[2]);
      doc.text(levelText, margin + 4, y + 5.5);

      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Score: ${Math.round(analysisResult.score * 100)} / 100`, margin + levelTextWidth + 25, y + 5.5);
      y += 15;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100);
      const explanationLines = doc.splitTextToSize(`"${analysisResult.explanation_high_level}"`, maxWidth);
      if (y + (explanationLines.length * 5) > pageHeight - margin) { doc.addPage(); y = 20; }
      doc.text(explanationLines, margin, y);
      y += (explanationLines.length * 5) + 5;
      doc.setTextColor(0);
      
      // --- Evidence ---
      drawSectionTitle('Evidence from Transcript');
      analysisResult.evidence_spans.forEach(span => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const textLines = doc.splitTextToSize(`"${span.text}"`, maxWidth - 10);
        doc.setFontSize(10);
        const reasonLines = doc.splitTextToSize(`- ${span.reason}`, maxWidth - 10);
        const blockHeight = (textLines.length * 5) + (reasonLines.length * 4) + 12;

        if (y + blockHeight > pageHeight - margin) { doc.addPage(); y = 20; }
        
        doc.setFillColor(239, 246, 255); // blue-50
        doc.roundedRect(margin, y, maxWidth, blockHeight, 3, 3, 'F');
        
        doc.setTextColor(30, 64, 175); // blue-800
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(textLines, margin + 5, y + 7);
        
        doc.setTextColor(59, 130, 246); // blue-500
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(reasonLines, margin + 5, y + 7 + (textLines.length * 5));

        y += blockHeight + 5;
        doc.setTextColor(0);
      });

      // --- Recommendations ---
      y+= 5;
      drawSectionTitle('Supportive Recommendations');
      analysisResult.recommendations.forEach((rec) => {
         doc.setFont('helvetica', 'normal');
         doc.setFontSize(11);
         const recLines = doc.splitTextToSize(rec, maxWidth - 8);
         if (y + (recLines.length * 5) > pageHeight - margin) { doc.addPage(); y = 20; }
         doc.text(`•`, margin + 2, y + 4.5);
         doc.text(recLines, margin + 6, y + 4.5);
         y += (recLines.length * 5) + 2;
      });

      // --- QC Notes ---
      if (analysisResult.qc_notes) {
        y += 5;
        drawSectionTitle('Quality Notes');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);
        const qcLines = doc.splitTextToSize(analysisResult.qc_notes, maxWidth);
        if (y + (qcLines.length * 4) > pageHeight - margin) { doc.addPage(); y = 20; }
        doc.text(qcLines, margin, y);
        y += (qcLines.length * 4) + 5;
      }

      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading || !analysisResult}
      className="p-2 text-gray-500 rounded-full disabled:text-gray-400 disabled:cursor-not-allowed hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-200 dark:hover:text-blue-400 dark:focus:ring-offset-gray-800"
      aria-label="Export analysis as PDF"
    >
      {isLoading ? (
        <span className="text-sm animate-pulse">Saving...</span>
      ) : (
        <DownloadIcon className="w-6 h-6" />
      )}
    </button>
  );
};
