/**
 * FINANCIAL OS — MONTE CARLO STOCHASTIC SIMULATION ENGINE
 * Executes 1,000 randomized market volatility simulations with confidence interval bands.
 */

const MonteCarloEngine = {

  /**
   * Generates a standard normal random variable using Box-Muller transform
   * @returns {number} Standard normal variable (Mean = 0, StdDev = 1)
   */
  boxMullerTransform() {
    let u1 = 0;
    let u2 = 0;
    // Avoid zero values to prevent Math.log(0) resulting in Infinity
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();

    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  },

  /**
   * Runs 1,000 Monte Carlo stochastic wealth trajectory simulations
   * @param {Object} params
   * @param {number} params.monthlySIP - Monthly investment amount
   * @param {number} params.durationYears - Total investment horizon in years
   * @param {number} [params.meanReturn=12.5] - Expected mean annual return (%)
   * @param {number} [params.volatility=15.0] - Annual return market volatility / std dev (%)
   * @param {number} [params.stepUpPercent=0] - Annual SIP step-up rate (%)
   * @param {number} [numSimulations=1000] - Total simulation count
   * @returns {Object} Statistical percentiles, success rate, and trajectory curves
   */
  runSimulation({ monthlySIP, durationYears, meanReturn = 12.5, volatility = 15.0, stepUpPercent = 0 }, numSimulations = 1000) {
    const totalMonths = durationYears * 12;
    const monthlyMean = meanReturn / 12 / 100;
    const monthlyVol = (volatility / Math.sqrt(12)) / 100;

    const finalCorpuses = [];
    const trajectories = [];

    for (let sim = 0; sim < numSimulations; sim++) {
      let corpus = 0;
      let currentSIP = monthlySIP;
      const simTrajectory = [];

      for (let m = 1; m <= totalMonths; m++) {
        // Stochastic random walk return for current month
        const z = this.boxMullerTransform();
        const randomMonthlyReturn = monthlyMean + z * monthlyVol;

        corpus += currentSIP;
        corpus += corpus * randomMonthlyReturn;

        // Track yearly snapshot for trajectory curves (store first 50 sims to keep DOM memory light)
        if (m % 12 === 0) {
          if (sim < 50) {
            simTrajectory.push(Math.round(corpus));
          }
          if (stepUpPercent > 0) {
            currentSIP += currentSIP * (stepUpPercent / 100);
          }
        }
      }

      if (sim < 50) {
        trajectories.push(simTrajectory);
      }

      finalCorpuses.push(Math.max(0, Math.round(corpus)));
    }

    // Sort final results ascending to compute statistical confidence bands
    finalCorpuses.sort((a, b) => a - b);

    const worstCaseIdx = Math.floor(numSimulations * 0.10);  // 10th percentile
    const medianCaseIdx = Math.floor(numSimulations * 0.50); // 50th percentile
    const bestCaseIdx = Math.floor(numSimulations * 0.90);   // 90th percentile

    const worstCase = finalCorpuses[worstCaseIdx];
    const medianCase = finalCorpuses[medianCaseIdx];
    const bestCase = finalCorpuses[bestCaseIdx];

    // Compute success probability against deterministic baseline calculation
    const deterministicBaseline = FinancialEngine.calculateSIP({
      monthlySIP,
      annualReturn: meanReturn,
      durationYears,
      stepUpPercent
    }).futureValue;

    const successfulRuns = finalCorpuses.filter(val => val >= deterministicBaseline).length;
    const successProbability = Math.round((successfulRuns / numSimulations) * 100);

    return {
      numSimulations,
      worstCase,
      medianCase,
      bestCase,
      successProbability,
      deterministicBaseline,
      sampleTrajectories: trajectories
    };
  }
};