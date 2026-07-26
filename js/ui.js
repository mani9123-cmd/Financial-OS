/**
 * FINANCIAL OS — UI ANIMATIONS, COUNTERS & INTERACTION ENGINE
 * Powered by GSAP, CountUp.js, Canvas Confetti, and custom DOM binders.
 */

const UIEngine = {
  activeCounters: {},

  /**
   * Smoothly animates numeric counters using CountUp.js
   * @param {string} elementId - ID of target DOM node
   * @param {number} targetValue - End numerical value
   */
  animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (this.activeCounters[elementId]) {
      this.activeCounters[elementId].update(targetValue);
    } else {
      const counter = new countUp.CountUp(elementId, targetValue, {
        duration: 1.2,
        useEasing: true,
        formattingFn: (val) => FinancialEngine.formatCurrency(val)
      });
      if (!counter.error) {
        counter.start();
        this.activeCounters[elementId] = counter;
      }
    }
  },

  /**
   * GSAP entrance animations for dashboard panels and KPI cards
   */
 /**
   * GSAP entrance animations for dashboard panels and KPI cards
   */
  animateEntrance() {
    if (typeof gsap === 'undefined') return;

    gsap.fromTo('[data-gsap="kpi"]', 
      { y: 20, opacity: 0 },
      {
        duration: 0.8,
        y: 0,
        opacity: 1,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform' // Automatically removes inline CSS transform after animation completes!
      }
    );

    gsap.from('.controls-card', {
      duration: 0.9,
      x: -30,
      opacity: 0,
      ease: 'power3.out',
      clearProps: 'transform'
    });

    gsap.from('.chart-display-card', {
      duration: 0.9,
      x: 30,
      opacity: 0,
      ease: 'power3.out',
      clearProps: 'transform'
    });
  },
  /**
   * Dynamic rule-based AI Financial Coach Insight Generator
   * @param {Object} results - Calculation output matrix from FinancialEngine
   * @param {Object} state - Active parameters state
   */
  updateAICoach(results, state) {
    const textEl = document.getElementById('aiCoachInsightText');
    if (!textEl) return;

    const insights = [];

    // Rule 1: Step-up power rule
    if (state.stepUpPercent > 0) {
      const stepUpContribution = Math.round(results.futureValue * (state.stepUpPercent / 100) * 2.5);
      insights.push(`Your ${state.stepUpPercent}% annual step-up compounding accelerates total corpus by ~₹${FinancialEngine.formatCurrency(stepUpContribution)} over ${state.durationYears} years.`);
    } else {
      insights.push(`Enabling a 10% annual step-up increases your eventual corpus velocity by over 41%.`);
    }

    // Rule 2: Inflation impact observation
    const inflationPercentageLoss = Math.round((results.inflationLoss / (results.futureValue || 1)) * 100);
    if (inflationPercentageLoss > 30) {
      insights.push(`Inflation reduces purchasing power by ${inflationPercentageLoss}%. Your ₹${FinancialEngine.formatCurrency(results.futureValue)} corpus equals ₹${FinancialEngine.formatCurrency(results.todaysRealValue)} in today's money.`);
    }

    // Rule 3: Wealth Multiplier milestone
    if (parseFloat(results.wealthMultiplier) >= 3.0) {
      insights.push(`Strong wealth velocity! Your investment multiplier reaches ${results.wealthMultiplier}x relative to total principal invested.`);
    } else {
      insights.push(`Extending your time horizon by 5 additional years could double your total return multiplier.`);
    }

    // Pick random insight from qualified rules
    const selectedInsight = insights[Math.floor(Math.random() * insights.length)];

    if (typeof gsap !== 'undefined') {
      gsap.to(textEl, {
        opacity: 0,
        y: -6,
        duration: 0.2,
        onComplete: () => {
          textEl.innerText = selectedInsight;
          gsap.to(textEl, { opacity: 1, y: 0, duration: 0.3 });
        }
      });
    } else {
      textEl.innerText = selectedInsight;
    }
  },

  /**
   * Opens universal glass modal overlay with custom body content
   * @param {string} title 
   * @param {string} htmlContent 
   */
  openModal(title, htmlContent) {
    const overlay = document.getElementById('appModalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');

    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.innerText = title;
    bodyEl.innerHTML = htmlContent;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  },

  /**
   * Closes active modal overlay
   */
  closeModal() {
    const overlay = document.getElementById('appModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
  },

  /**
   * Triggers celebratory Canvas Confetti burst
   */
  triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b']
      });
    }
  }
};
