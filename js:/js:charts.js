/**
 * FINANCIAL OS — CHART VISUALIZATION ENGINE
 * Custom Chart.js integration with dark glass styling, gradients, and animated morphs.
 */

const ChartEngine = {
  primaryChartInstance: null,
  monteCarloChartInstance: null,

  /**
   * Destroys existing primary chart instance to prevent memory leaks
   */
  destroyPrimaryChart() {
    if (this.primaryChartInstance) {
      this.primaryChartInstance.destroy();
      this.primaryChartInstance = null;
    }
  },

  /**
   * Destroys existing Monte Carlo chart instance
   */
  destroyMonteCarloChart() {
    if (this.monteCarloChartInstance) {
      this.monteCarloChartInstance.destroy();
      this.monteCarloChartInstance = null;
    }
  },

  /**
   * Renders Primary Wealth Growth Area Line Chart
   * @param {HTMLCanvasElement} canvas - Target HTML5 Canvas DOM element
   * @param {Array<Object>} yearlyBreakdown - Calculation matrix from FinancialEngine
   */
  renderGrowthChart(canvas, yearlyBreakdown) {
    if (!canvas) return;
    this.destroyPrimaryChart();

    const ctx = canvas.getContext('2d');
    const labels = yearlyBreakdown.map(d => `Yr ${d.year}`);
    const futureValues = yearlyBreakdown.map(d => d.futureValue);
    const totalInvested = yearlyBreakdown.map(d => d.totalInvested);
    const realValues = yearlyBreakdown.map(d => d.realValueToday);

    // Dynamic Vertical Canvas Gradients
    const gradientAccent = ctx.createLinearGradient(0, 0, 0, 320);
    gradientAccent.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    gradientAccent.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

    const gradientSuccess = ctx.createLinearGradient(0, 0, 0, 320);
    gradientSuccess.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradientSuccess.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

    this.primaryChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Projected Corpus',
            data: futureValues,
            borderColor: '#6366f1',
            borderWidth: 3,
            backgroundColor: gradientAccent,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#6366f1',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
          },
          {
            label: 'Total Outlay Invested',
            data: totalInvested,
            borderColor: '#64748b',
            borderWidth: 2,
            borderDash: [6, 6],
            fill: false,
            tension: 0.1,
            pointRadius: 0
          },
          {
            label: "Today's Purchasing Power",
            data: realValues,
            borderColor: '#f59e0b',
            borderWidth: 2,
            backgroundColor: gradientSuccess,
            fill: false,
            tension: 0.35,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 12, weight: '500' },
              usePointStyle: true,
              boxWidth: 8,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                return `${label}: ₹${FinancialEngine.formatCurrency(val)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (value) => '₹' + FinancialEngine.formatCurrency(value)
            }
          }
        }
      }
    });
  },

  /**
   * Renders Asset Breakdown Doughnut Chart
   * @param {HTMLCanvasElement} canvas 
   * @param {number} totalInvested 
   * @param {number} totalReturns 
   */
  renderBreakdownChart(canvas, totalInvested, totalReturns) {
    if (!canvas) return;
    this.destroyPrimaryChart();

    this.primaryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Principal Invested', 'Estimated Returns Earned'],
        datasets: [{
          data: [totalInvested, totalReturns],
          backgroundColor: [
            'rgba(100, 116, 139, 0.8)',
            'rgba(99, 102, 241, 0.85)'
          ],
          borderColor: [
            'rgba(100, 116, 139, 1)',
            'rgba(99, 102, 241, 1)'
          ],
          borderWidth: 1,
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ₹${FinancialEngine.formatCurrency(ctx.parsed)}`
            }
          }
        }
      }
    });
  },

  /**
   * Renders Monte Carlo Probability Band Trajectory Chart
   * @param {HTMLCanvasElement} canvas 
   * @param {Object} mcResults - Results from MonteCarloEngine.runSimulation
   */
  renderMonteCarloChart(canvas, mcResults) {
    if (!canvas) return;
    this.destroyMonteCarloChart();

    const ctx = canvas.getContext('2d');
    const trajectoryCount = mcResults.sampleTrajectories[0].length;
    const labels = Array.from({ length: trajectoryCount }, (_, i) => `Yr ${i + 1}`);

    const datasets = mcResults.sampleTrajectories.map((traj, idx) => ({
      label: `Sim ${idx + 1}`,
      data: traj,
      borderColor: idx === 0 ? '#10b981' : 'rgba(99, 102, 241, 0.12)',
      borderWidth: idx === 0 ? 3 : 1,
      pointRadius: 0,
      fill: false,
      tension: 0.3
    }));

    this.monteCarloChartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b' } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono' },
              callback: (val) => '₹' + FinancialEngine.formatCurrency(val)
            }
          }
        }
      }
    });
  }
};