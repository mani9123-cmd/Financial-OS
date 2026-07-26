/**
 * FINANCIAL OS — PRECISION FINANCIAL MATHEMATICS ENGINE
 * Pure functional calculation engine for SIP, FIRE, SWP, and EMI strategies.
 */

const FinancialEngine = {

  /**
   * Calculates Compound Wealth Growth with Monthly SIP and Annual Step-Up
   * @param {Object} params
   * @param {number} params.monthlySIP - Initial monthly SIP contribution in ₹
   * @param {number} params.annualReturn - Expected annual rate of return (%)
   * @param {number} params.durationYears - Total investment duration in years
   * @param {number} [params.stepUpPercent=0] - Annual increase in SIP contribution (%)
   * @param {number} [params.inflationRate=6.0] - Estimated annual inflation rate (%)
   * @returns {Object} Comprehensive calculation matrix and yearly breakdowns
   */
  calculateSIP({ monthlySIP, annualReturn, durationYears, stepUpPercent = 0, inflationRate = 6.0 }) {
    const monthlyRate = annualReturn / 12 / 100;
    let totalInvested = 0;
    let currentMonthlySIP = monthlySIP;
    let corpus = 0;

    const yearlyBreakdown = [];

    for (let year = 1; year <= durationYears; year++) {
      let yearlyInvested = 0;
      let yearlyInterestEarned = 0;

      for (let month = 1; month <= 12; month++) {
        corpus += currentMonthlySIP;
        yearlyInvested += currentMonthlySIP;
        totalInvested += currentMonthlySIP;

        const monthlyInterest = corpus * monthlyRate;
        corpus += monthlyInterest;
        yearlyInterestEarned += monthlyInterest;
      }

      // Compute inflation purchasing power factor for the current year
      const inflationFactor = Math.pow(1 + inflationRate / 100, year);
      const realValueToday = corpus / inflationFactor;

      yearlyBreakdown.push({
        year,
        currentMonthlySIP: Math.round(currentMonthlySIP),
        yearlyInvested: Math.round(yearlyInvested),
        totalInvested: Math.round(totalInvested),
        futureValue: Math.round(corpus),
        realValueToday: Math.round(realValueToday),
        wealthGain: Math.round(corpus - totalInvested)
      });

      // Apply annual step-up percentage to SIP amount for next year
      if (stepUpPercent > 0) {
        currentMonthlySIP += currentMonthlySIP * (stepUpPercent / 100);
      }
    }

    const totalReturns = corpus - totalInvested;
    const wealthMultiplier = corpus / (totalInvested || 1);
    const inflationFactorFinal = Math.pow(1 + inflationRate / 100, durationYears);
    const todaysRealValue = corpus / inflationFactorFinal;

    return {
      futureValue: Math.round(corpus),
      todaysRealValue: Math.round(todaysRealValue),
      totalInvested: Math.round(totalInvested),
      totalReturns: Math.round(totalReturns),
      wealthMultiplier: wealthMultiplier.toFixed(2),
      inflationLoss: Math.round(corpus - todaysRealValue),
      yearlyBreakdown
    };
  },

  /**
   * Calculates FIRE (Financial Independence, Retire Early) targets
   * @param {Object} params
   * @param {number} params.currentExpenses - Current monthly living expenses in ₹
   * @param {number} params.currentAge - Current age of user
   * @param {number} params.targetAge - Desired retirement age
   * @param {number} [params.swr=4.0] - Safe Withdrawal Rate (%)
   * @param {number} [params.inflationRate=6.0] - Inflation rate (%)
   * @param {number} [params.annualReturn=10.0] - Return on investments (%)
   * @returns {Object} FIRE corpus targets across variants
   */
  calculateFIRE({ currentExpenses, currentAge, targetAge, swr = 4.0, inflationRate = 6.0, annualReturn = 10.0 }) {
    const yearsToRetire = Math.max(0, targetAge - currentAge);
    const futureMonthlyExpense = currentExpenses * Math.pow(1 + inflationRate / 100, yearsToRetire);
    const futureAnnualExpense = futureMonthlyExpense * 12;

    // Corpus required based on Safe Withdrawal Rate multiplier
    const fireCorpusNeeded = futureAnnualExpense * (100 / swr);

    return {
      yearsToRetire,
      futureMonthlyExpense: Math.round(futureMonthlyExpense),
      fireCorpusNeeded: Math.round(fireCorpusNeeded),
      leanFIRE: Math.round(fireCorpusNeeded * 0.75),
      fatFIRE: Math.round(fireCorpusNeeded * 1.5),
      coastFIRE: Math.round(fireCorpusNeeded / Math.pow(1 + annualReturn / 100, yearsToRetire))
    };
  },

  /**
   * Calculates Systematic Withdrawal Plan (SWP) cashflow depletion
   * @param {Object} params
   * @param {number} params.initialCorpus - Total initial lump sum invested
   * @param {number} params.monthlyWithdrawal - Initial monthly payout amount
   * @param {number} params.annualReturn - Expected return p.a. (%)
   * @param {number} params.durationYears - Withdrawal duration in years
   * @param {number} [params.withdrawalStepUp=0] - Annual increase in withdrawal for inflation (%)
   * @returns {Object} Final remaining corpus and depletion trajectory
   */
  calculateSWP({ initialCorpus, monthlyWithdrawal, annualReturn, durationYears, withdrawalStepUp = 0 }) {
    let corpus = initialCorpus;
    let currentWithdrawal = monthlyWithdrawal;
    const monthlyRate = annualReturn / 12 / 100;
    let totalWithdrawn = 0;
    const monthlyTrajectory = [];

    for (let month = 1; month <= durationYears * 12; month++) {
      if (corpus <= 0) {
        corpus = 0;
        break;
      }

      corpus -= currentWithdrawal;
      totalWithdrawn += currentWithdrawal;
      const interestEarned = corpus * monthlyRate;
      corpus += interestEarned;

      if (month % 12 === 0) {
        currentWithdrawal += currentWithdrawal * (withdrawalStepUp / 100);
      }

      monthlyTrajectory.push({
        month,
        remainingCorpus: Math.round(corpus),
        totalWithdrawn: Math.round(totalWithdrawn)
      });
    }

    return {
      remainingCorpus: Math.round(corpus),
      totalWithdrawn: Math.round(totalWithdrawn),
      monthlyTrajectory
    };
  },

  /**
   * EMI vs SIP Comparison Matrix: Renting & SIP Investing vs Home Purchase & EMI
   * @param {Object} params
   * @param {number} params.propertyPrice - Cost of property
   * @param {number} params.downPayment - Initial cash down payment
   * @param {number} params.loanInterestRate - Home loan interest rate (%)
   * @param {number} params.loanTenureYears - Loan duration in years
   * @param {number} params.expectedSIPReturn - Return rate if investing difference (%)
   * @returns {Object} Comparative net worth breakdown
   */
  calculateEMIvSIP({ propertyPrice, downPayment, loanInterestRate, loanTenureYears, expectedSIPReturn }) {
    const loanAmount = propertyPrice - downPayment;
    const monthlyInterestRate = loanInterestRate / 12 / 100;
    const totalMonths = loanTenureYears * 12;

    // Standard EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths)) / 
                (Math.pow(1 + monthlyInterestRate, totalMonths) - 1);

    const totalEmiPaid = emi * totalMonths;
    const totalCostOfProperty = downPayment + totalEmiPaid;

    // SIP Path: Down payment invested as lump sum + monthly EMI invested as SIP
    const sipResult = this.calculateSIP({
      monthlySIP: Math.round(emi),
      annualReturn: expectedSIPReturn,
      durationYears: loanTenureYears,
      stepUpPercent: 0
    });

    const lumpSumGrowth = downPayment * Math.pow(1 + expectedSIPReturn / 100, loanTenureYears);
    const totalNetWorthIfInvested = sipResult.futureValue + lumpSumGrowth;

    return {
      monthlyEMI: Math.round(emi),
      totalEmiPaid: Math.round(totalEmiPaid),
      totalCostOfProperty: Math.round(totalCostOfProperty),
      totalNetWorthIfInvested: Math.round(totalNetWorthIfInvested),
      investingAdvantage: Math.round(totalNetWorthIfInvested - propertyPrice)
    };
  },

  /**
   * Formats Indian Rupee values into concise Lakhs (L) or Crores (Cr)
   * @param {number} amount 
   * @returns {string} Human-readable formatted string
   */
  formatCurrency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    const val = Math.abs(amount);

    if (val >= 10000000) {
      return (amount / 10000000).toFixed(2) + ' Cr';
    } else if (val >= 100000) {
      return (amount / 100000).toFixed(2) + ' L';
    } else if (val >= 1000) {
      return (amount / 1000).toFixed(1) + ' k';
    }

    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  }
};