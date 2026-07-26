/**
 * FINANCIAL OS — EXPORT & REPORT GENERATION ENGINE
 * Handles PDF generation, CSV data export, PNG canvas snapshots, and plan sharing.
 */

const ExportEngine = {

  /**
   * Captures active workspace view and compiles a high-DPI Pro Financial PDF Report
   */
  async exportPDF() {
    const targetElement = document.getElementById('mainContent');
    if (!targetElement) return;

    const btn = document.getElementById('btnExportPDF');
    const originalContent = btn ? btn.innerHTML : '';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <span>Compiling Report...</span>
      `;
    }

    try {
      // High-res canvas render configuration
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        backgroundColor: '#090d16',
        useCORS: true,
        logging: false,
        ignoreElements: (element) => element.id === 'btnExportPDF' || element.id === 'btnSaveScenario'
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      
      // Initialize A4 Portrait Document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multi-page overflow seamlessly
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Financial-OS-Pro-Report-${Date.now()}.pdf`);
      UIEngine.triggerConfetti();

    } catch (err) {
      console.error('[Financial OS Export] PDF export error:', err);
      alert('Unable to generate PDF report. Please check console logs.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    }
  },

  /**
   * Generates and triggers download of yearly breakdown matrix as a CSV file
   * @param {Array<Object>} yearlyBreakdown 
   */
  exportCSV(yearlyBreakdown) {
    if (!yearlyBreakdown || !yearlyBreakdown.length) return;

    const headers = ['Year', 'Monthly SIP (INR)', 'Yearly Invested (INR)', 'Total Invested (INR)', 'Future Value (INR)', 'Real Value Today (INR)', 'Wealth Gain (INR)'];
    
    const rows = yearlyBreakdown.map(row => [
      row.year,
      row.currentMonthlySIP,
      row.yearlyInvested,
      row.totalInvested,
      row.futureValue,
      row.realValueToday,
      row.wealthGain
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,' 
      + headers.join(',') + '\n'
      + rows.map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-os-breakdown-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Generates a shareable URL containing encoded active parameters
   * @param {Object} state - Current parameter state
   * @returns {string} Fully qualified URL string
   */
  generateShareURL(state) {
    const params = new URLSearchParams({
      sip: state.monthlySIP,
      ret: state.expectedReturn,
      dur: state.durationYears,
      step: state.stepUpPercent,
      inf: state.inflationRate
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }

    return shareUrl;
  }
};