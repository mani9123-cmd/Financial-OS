/**
 * FINANCIAL OS — MAIN APPLICATION CONTROLLER & ROUTER
 * Orchestrates inputs, event bindings, chart updates, state synchronization, and router views.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Primary Control & Element References
  const elements = {
    // Navigation & Layout Nodes
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    activePageTitle: document.getElementById('activePageTitle'),
    activePageSubtitle: document.getElementById('activePageSubtitle'),
    mainContent: document.getElementById('mainContent'),

    // Control Inputs & Range Sliders
    inputSIP: document.getElementById('inputMonthlySIP'),
    sliderSIP: document.getElementById('sliderMonthlySIP'),
    inputReturn: document.getElementById('inputExpectedReturn'),
    sliderReturn: document.getElementById('sliderExpectedReturn'),
    inputDuration: document.getElementById('inputDuration'),
    sliderDuration: document.getElementById('sliderDuration'),
    inputStepUp: document.getElementById('inputStepUp'),
    sliderStepUp: document.getElementById('sliderStepUp'),
    inputInflation: document.getElementById('inputInflation'),
    sliderInflation: document.getElementById('sliderInflation'),
    inputTaxRate: document.getElementById('inputTaxRate'),
    btnResetControls: document.getElementById('btnResetControls'),

    // Chart Canvas Elements
    primaryChartCanvas: document.getElementById('primaryChart'),
    monteCarloChartCanvas: document.getElementById('monteCarloChart'),

    // Actions & Modals
    btnSaveScenario: document.getElementById('btnSaveScenario'),
    btnExportPDF: document.getElementById('btnExportPDF'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    appModalOverlay: document.getElementById('appModalOverlay'),
    btnOpenAddGoalModal: document.getElementById('btnOpenAddGoalModal'),
    btnRunMonteCarlo: document.getElementById('btnRunMonteCarlo')
  };

  /**
   * Main recalculation and view update pipeline
   */
  function updatePipeline() {
    const currentState = Store.state;

    // 1. Compute Primary Investment SIP Growth Matrix
    const sipResults = FinancialEngine.calculateSIP({
      monthlySIP: currentState.monthlySIP,
      annualReturn: currentState.expectedReturn,
      durationYears: currentState.durationYears,
      stepUpPercent: currentState.stepUpPercent,
      inflationRate: currentState.inflationRate
    });

    // 2. Animate Dashboard KPI Metric Counters
    UIEngine.animateCounter('kpiFutureValue', sipResults.futureValue);
    UIEngine.animateCounter('kpiTodayValue', sipResults.todaysRealValue);
    UIEngine.animateCounter('kpiTotalInvested', sipResults.totalInvested);
    UIEngine.animateCounter('kpiTotalReturns', sipResults.totalReturns);

    // Calculate percentage gain
    const growthPercent = sipResults.totalInvested > 0 
      ? ((sipResults.totalReturns / sipResults.totalInvested) * 100).toFixed(1) 
      : '0.0';

    const growthPercentEl = document.getElementById('kpiGrowthPercent');
    if (growthPercentEl) growthPercentEl.innerText = `+${growthPercent}%`;

    const multiplierEl = document.getElementById('kpiMultiplier');
    if (multiplierEl) multiplierEl.innerText = `${sipResults.wealthMultiplier}x`;

    const inflationLossEl = document.getElementById('kpiInflationLoss');
    if (inflationLossEl) {
      inflationLossEl.innerText = `Purchasing power loss: ₹${FinancialEngine.formatCurrency(sipResults.inflationLoss)}`;
    }

    // 3. Render Chart Visualizations based on active tab selection
    if (elements.primaryChartCanvas && currentState.activeTab === 'dashboard') {
      if (currentState.activeChartType === 'breakdown') {
        ChartEngine.renderBreakdownChart(
          elements.primaryChartCanvas, 
          sipResults.totalInvested, 
          sipResults.totalReturns
        );
      } else {
        ChartEngine.renderGrowthChart(elements.primaryChartCanvas, sipResults.yearlyBreakdown);
      }
    }

    // 4. Update Dynamic AI Coach Live Insight Banner
    UIEngine.updateAICoach(sipResults, currentState);

    // 5. Compute Financial Health Score & Update Sidebar Ring Widget
    const health = HealthScoreEngine.evaluateHealth({
      emergencyFundMonths: 6,
      sipToIncomeRatio: Math.min(50, Math.round((currentState.monthlySIP / 100000) * 100)),
      hasInsurance: true,
      debtToIncomeRatio: 15
    });

    const miniHealthVal = document.getElementById('miniHealthValue');
    const miniHealthCircle = document.getElementById('miniHealthCircle');
    const miniHealthStatus = document.getElementById('miniHealthStatus');

    if (miniHealthVal) miniHealthVal.innerText = health.score;
    if (miniHealthCircle) miniHealthCircle.setAttribute('stroke-dasharray', `${health.score}, 100`);
    if (miniHealthStatus) {
      miniHealthStatus.innerText = health.statusLabel;
      miniHealthStatus.className = `health-status ${health.statusColorClass}`;
    }

    // 6. Populate Detailed Investment Breakdown Table (View 2)
    renderInvestmentTable(sipResults.yearlyBreakdown);

    // 7. Update Financial Life Timeline (View 3)
    renderTimeline(sipResults.yearlyBreakdown);

    // 8. Update Retirement Suite Values (View 5)
    renderRetirementSuite(currentState);

    // 9. Update FIRE Calculator Values (View 6)
    renderFIRESuite(currentState);
  }

  /**
   * Renders the Year-by-Year Breakdown Table
   */
  function renderInvestmentTable(breakdown) {
    const tableBody = document.getElementById('investmentTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = breakdown.map(row => `
      <tr>
        <td>Yr ${row.year}</td>
        <td>₹${FinancialEngine.formatCurrency(row.currentMonthlySIP)}</td>
        <td>₹${FinancialEngine.formatCurrency(row.yearlyInvested)}</td>
        <td>₹${FinancialEngine.formatCurrency(row.totalInvested)}</td>
        <td class="text-accent">₹${FinancialEngine.formatCurrency(row.futureValue)}</td>
        <td class="text-warning">₹${FinancialEngine.formatCurrency(row.realValueToday)}</td>
      </tr>
    `).join('');
  }

  /**
   * Renders Milestone Timeline Nodes
   */
  function renderTimeline(breakdown) {
    const container = document.getElementById('timelineMilestones');
    if (!container) return;

    // Filter key milestone years (every 5 years or final year)
    const milestones = breakdown.filter(b => b.year % 5 === 0 || b.year === breakdown.length);

    container.innerHTML = milestones.map(m => `
      <div class="timeline-node" style="margin-bottom: 20px; padding: 12px; border-left: 3px solid #6366f1; background: rgba(255,255,255,0.02);">
        <h4 style="color: #818cf8;">Year ${m.year} Target Milestone</h4>
        <p>Total Invested: <strong>₹${FinancialEngine.formatCurrency(m.totalInvested)}</strong></p>
        <p>Projected Corpus: <strong class="text-success">₹${FinancialEngine.formatCurrency(m.futureValue)}</strong></p>
      </div>
    `).join('');
  }

  /**
   * Renders Retirement Suite Corpus Target
   */
  function renderRetirementSuite(state) {
    const currentAge = parseInt(document.getElementById('retCurrentAge')?.value || 30, 10);
    const targetAge = parseInt(document.getElementById('retAge')?.value || 55, 10);
    const expenses = parseInt(document.getElementById('retExpenses')?.value || 75000, 10);

    const fireData = FinancialEngine.calculateFIRE({
      currentExpenses: expenses,
      currentAge,
      targetAge,
      swr: 4.0,
      inflationRate: state.inflationRate,
      annualReturn: state.expectedReturn
    });

    const corpusEl = document.getElementById('retCorpusVal');
    if (corpusEl) {
      UIEngine.animateCounter('retCorpusVal', fireData.fireCorpusNeeded);
    }
  }

  /**
   * Renders FIRE Calculator Corpus Bands
   */
  function renderFIRESuite(state) {
    const expenses = parseInt(document.getElementById('retExpenses')?.value || 75000, 10);
    
    const fireData = FinancialEngine.calculateFIRE({
      currentExpenses: expenses,
      currentAge: 30,
      targetAge: 55,
      swr: 4.0,
      inflationRate: state.inflationRate
    });

    UIEngine.animateCounter('fireLeanVal', fireData.leanFIRE);
    UIEngine.animateCounter('fireStandardVal', fireData.fireCorpusNeeded);
    UIEngine.animateCounter('fireFatVal', fireData.fatFIRE);
  }

  /**
   * Binds Form Controls and Sliders bidirectionally
   */
  function bindInputEvents(inputEl, sliderEl, stateKey, isFloat = false) {
    if (!inputEl || !sliderEl) return;

    inputEl.addEventListener('input', (e) => {
      const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        sliderEl.value = val;
        Store.setState({ [stateKey]: val });
      }
    });

    sliderEl.addEventListener('input', (e) => {
      const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
      inputEl.value = val;
      Store.setState({ [stateKey]: val });
    });
  }

  // Bind Parameter Controls
  bindInputEvents(elements.inputSIP, elements.sliderSIP, 'monthlySIP');
  bindInputEvents(elements.inputReturn, elements.sliderReturn, 'expectedReturn', true);
  bindInputEvents(elements.inputDuration, elements.sliderDuration, 'durationYears');
  bindInputEvents(elements.inputStepUp, elements.sliderStepUp, 'stepUpPercent');
  bindInputEvents(elements.inputInflation, elements.sliderInflation, 'inflationRate', true);

  if (elements.inputTaxRate) {
    elements.inputTaxRate.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) Store.setState({ taxRate: val });
    });
  }

  // Quick SIP Step Chips
  document.querySelectorAll('[data-step-sip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.getAttribute('data-step-sip'), 10);
      const newSIP = Store.state.monthlySIP + step;
      elements.inputSIP.value = newSIP;
      elements.sliderSIP.value = newSIP;
      Store.setState({ monthlySIP: newSIP });
    });
  });

  // Chart Display Tab Switcher
  document.querySelectorAll('.chart-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const chartType = btn.getAttribute('data-chart-type');
      Store.setState({ activeChartType: chartType });
    });
  });

  // Navigation Router & View Switcher
  document.querySelectorAll('.nav-item').forEach(navBtn => {
    navBtn.addEventListener('click', () => {
      const targetTab = navBtn.getAttribute('data-tab');
      
      document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));

      navBtn.classList.add('active');
      navBtn.setAttribute('aria-current', 'page');

      const targetView = document.getElementById(`view-${targetTab}`);
      if (targetView) {
        targetView.classList.add('active');
      }

      // Update Page Header Title & Breadcrumb Subtitle
      const navText = navBtn.querySelector('span')?.innerText || 'Dashboard';
      if (elements.activePageTitle) elements.activePageTitle.innerText = navText;
      if (elements.activePageSubtitle) {
        elements.activePageSubtitle.innerText = `Real-time analytics and controls for ${navText.toLowerCase()}.`;
      }

      Store.setState({ activeTab: targetTab });
    });
  });

  // Sidebar Collapse Toggle
  if (elements.sidebarToggle) {
    elements.sidebarToggle.addEventListener('click', () => {
      elements.sidebar.classList.toggle('collapsed');
    });
  }

  // Reset Parameters Button
  if (elements.btnResetControls) {
    elements.btnResetControls.addEventListener('click', () => {
      Store.setState({
        monthlySIP: 25000,
        expectedReturn: 12.5,
        durationYears: 15,
        stepUpPercent: 10,
        inflationRate: 6.0,
        taxRate: 12.5
      });

      elements.inputSIP.value = 25000;
      elements.sliderSIP.value = 25000;
      elements.inputReturn.value = 12.5;
      elements.sliderReturn.value = 12.5;
      elements.inputDuration.value = 15;
      elements.sliderDuration.value = 15;
      elements.inputStepUp.value = 10;
      elements.sliderStepUp.value = 10;
      elements.inputInflation.value = 6.0;
      elements.sliderInflation.value = 6.0;
    });
  }

  // Save Scenario Button
  if (elements.btnSaveScenario) {
    elements.btnSaveScenario.addEventListener('click', () => {
      const name = prompt('Enter a name for this financial scenario:', `Plan ${Store.state.savedScenarios.length + 1}`);
      if (name) {
        Store.saveCurrentScenario(name);
        UIEngine.triggerConfetti();
        alert(`Scenario "${name}" saved to local storage!`);
      }
    });
  }

  // Export PDF Button
  if (elements.btnExportPDF) {
    elements.btnExportPDF.addEventListener('click', () => {
      ExportEngine.exportPDF();
    });
  }

  // Run Monte Carlo Simulation Button
  if (elements.btnRunMonteCarlo) {
    elements.btnRunMonteCarlo.addEventListener('click', () => {
      const mcResults = MonteCarloEngine.runSimulation({
        monthlySIP: Store.state.monthlySIP,
        durationYears: Store.state.durationYears,
        meanReturn: Store.state.expectedReturn,
        volatility: 15.0,
        stepUpPercent: Store.state.stepUpPercent
      }, 1000);

      const successRateEl = document.getElementById('mcSuccessRate');
      const medianCorpusEl = document.getElementById('mcMedianCorpus');

      if (successRateEl) successRateEl.innerText = `${mcResults.successProbability}%`;
      if (medianCorpusEl) medianCorpusEl.innerText = `₹${FinancialEngine.formatCurrency(mcResults.medianCase)}`;

      if (elements.monteCarloChartCanvas) {
        ChartEngine.renderMonteCarloChart(elements.monteCarloChartCanvas, mcResults);
      }
    });
  }

  // Modal Open & Close Triggers
  if (elements.btnOpenAddGoalModal) {
    elements.btnOpenAddGoalModal.addEventListener('click', () => {
      UIEngine.openModal(
        'Configure New Life Goal',
        `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="control-group">
              <label>Goal Name</label>
              <input type="text" id="goalTitleInput" class="input-unit-wrap" value="Buy Dream Villa" style="width: 100%; text-align: left;" />
            </div>
            <div class="control-group">
              <label>Target Amount (₹)</label>
              <input type="number" id="goalAmountInput" class="input-unit-wrap" value="25000000" style="width: 100%; text-align: right;" />
            </div>
            <div class="control-group">
              <label>Target Year</label>
              <input type="number" id="goalYearInput" class="input-unit-wrap" value="2038" style="width: 100%; text-align: right;" />
            </div>
            <button id="btnSaveGoalModal" class="btn btn-primary" style="margin-top: 12px;">Save Goal Strategy</button>
          </div>
        `
      );

      const btnSaveGoal = document.getElementById('btnSaveGoalModal');
      if (btnSaveGoal) {
        btnSaveGoal.addEventListener('click', () => {
          UIEngine.closeModal();
          UIEngine.triggerConfetti();
        });
      }
    });
  }

  if (elements.btnCloseModal) {
    elements.btnCloseModal.addEventListener('click', () => UIEngine.closeModal());
  }

  if (elements.appModalOverlay) {
    elements.appModalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.appModalOverlay) UIEngine.closeModal();
    });
  }

  // Subscribe to Central State Changes
  Store.subscribe('STATE_CHANGE', () => {
    updatePipeline();
  });

  // Initial Boot Engine Execution
  UIEngine.animateEntrance();
  updatePipeline();
});