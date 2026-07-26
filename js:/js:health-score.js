/**
 * FINANCIAL OS — FINANCIAL HEALTH SCORE ENGINE
 * Evaluates holistic financial parameters to derive a 0-100 composite index.
 */

const HealthScoreEngine = {

  /**
   * Computes weighted financial health score and actionable recommendations
   * @param {Object} params
   * @param {number} [params.emergencyFundMonths=6] - Months of expenses saved
   * @param {number} [params.sipToIncomeRatio=30] - % of net monthly income invested
   * @param {boolean} [params.hasInsurance=true] - Adequate health & life term cover
   * @param {number} [params.debtToIncomeRatio=15] - % of net monthly income spent on debt EMIs
   * @param {number} [params.diversificationCount=3] - Number of distinct asset classes held
   * @returns {Object} Score breakdown, health rating label, and improvement actions
   */
  evaluateHealth({
    emergencyFundMonths = 6,
    sipToIncomeRatio = 30,
    hasInsurance = true,
    debtToIncomeRatio = 15,
    diversificationCount = 3
  } = {}) {
    let score = 0;
    const metricBreakdown = [];
    const recommendations = [];

    // 1. Emergency Reserve Shield (Max 25 points)
    if (emergencyFundMonths >= 6) {
      score += 25;
      metricBreakdown.push({ name: 'Emergency Runway', score: 25, max: 25, status: 'Optimal' });
    } else {
      const pts = Math.round((emergencyFundMonths / 6) * 25);
      score += pts;
      metricBreakdown.push({ name: 'Emergency Runway', score: pts, max: 25, status: 'Underfunded' });
      recommendations.push(`Build emergency liquidity buffer from ${emergencyFundMonths} months to 6 months of expenses.`);
    }

    // 2. Investment Velocity & Savings Rate (Max 35 points)
    if (sipToIncomeRatio >= 30) {
      score += 35;
      metricBreakdown.push({ name: 'Investment Velocity', score: 35, max: 35, status: 'Optimal' });
    } else {
      const pts = Math.round((sipToIncomeRatio / 30) * 35);
      score += pts;
      metricBreakdown.push({ name: 'Investment Velocity', score: pts, max: 35, status: 'Sub-optimal' });
      recommendations.push(`Target raising monthly investment allocation to at least 30% of income (currently ${sipToIncomeRatio}%).`);
    }

    // 3. Risk Shield & Insurance (Max 20 points)
    if (hasInsurance) {
      score += 20;
      metricBreakdown.push({ name: 'Risk Coverage', score: 20, max: 20, status: 'Protected' });
    } else {
      metricBreakdown.push({ name: 'Risk Coverage', score: 0, max: 20, status: 'Exposed' });
      recommendations.push('Acquire term life and comprehensive health insurance to protect investment corpus from black-swan events.');
    }

    // 4. Debt Strain & EMI Ratio (Max 10 points)
    if (debtToIncomeRatio <= 20) {
      score += 10;
      metricBreakdown.push({ name: 'Debt Control', score: 10, max: 10, status: 'Healthy' });
    } else if (debtToIncomeRatio <= 40) {
      score += 5;
      metricBreakdown.push({ name: 'Debt Control', score: 5, max: 10, status: 'Moderate' });
      recommendations.push(`Consolidate high-interest debt. Debt EMI takes up ${debtToIncomeRatio}% of monthly income.`);
    } else {
      metricBreakdown.push({ name: 'Debt Control', score: 0, max: 10, status: 'High Strain' });
      recommendations.push('High debt warning: Aggressively pay down non-asset debt to lower EMI burden below 20% of income.');
    }

    // 5. Portfolio Asset Diversification (Max 10 points)
    if (diversificationCount >= 3) {
      score += 10;
      metricBreakdown.push({ name: 'Asset Diversification', score: 10, max: 10, status: 'Balanced' });
    } else {
      const pts = Math.round((diversificationCount / 3) * 10);
      score += pts;
      metricBreakdown.push({ name: 'Asset Diversification', score: pts, max: 10, status: 'Concentrated' });
      recommendations.push('Spread capital across non-correlated asset classes (Equity, Fixed Income, Gold, Real Estate).');
    }

    // Overall Status Label Mapping
    let statusLabel = 'Critical Attention';
    let statusColorClass = 'text-danger';

    if (score >= 80) {
      statusLabel = 'Optimal State';
      statusColorClass = 'text-success';
    } else if (score >= 60) {
      statusLabel = 'Good Standing';
      statusColorClass = 'text-warning';
    } else if (score >= 40) {
      statusLabel = 'Moderate Exposure';
      statusColorClass = 'text-warning';
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      statusLabel,
      statusColorClass,
      metricBreakdown,
      recommendations
    };
  }
};