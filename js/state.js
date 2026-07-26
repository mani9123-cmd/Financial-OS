/**
 * FINANCIAL OS — CENTRAL REACTIVE STATE STORE & EVENT BUS
 * Manages reactive parameter updates, local storage scenarios, and view states.
 */

const Store = {
  // Application State Memory Model
  state: {
    // Primary Parameters
    monthlySIP: 25000,
    expectedReturn: 12.5,
    durationYears: 15,
    stepUpPercent: 10,
    inflationRate: 6.0,
    taxRate: 12.5,

    // Navigation & Workspace State
    activeTab: 'dashboard',
    activeChartType: 'growth',

    // Goal Planner Module State
    goals: [
      { id: 'goal-1', title: 'Buy Luxury Home', targetAmount: 15000000, targetYear: 2035, currentSavings: 1000000, priority: 'High', icon: '🏠' },
      { id: 'goal-2', title: 'Child Higher Education', targetAmount: 5000000, targetYear: 2032, currentSavings: 500000, priority: 'Critical', icon: '🎓' }
    ],

    // Saved Scenarios
    savedScenarios: []
  },

  // Subscriber Event Register
  listeners: {},

  /**
   * Initialize state from browser localStorage if available
   */
  init() {
    try {
      const persistedScenarios = localStorage.getItem('fin_os_scenarios');
      if (persistedScenarios) {
        this.state.savedScenarios = JSON.parse(persistedScenarios);
      }
      
      const persistedParams = localStorage.getItem('fin_os_active_params');
      if (persistedParams) {
        const parsed = JSON.parse(persistedParams);
        this.state = { ...this.state, ...parsed };
      }
    } catch (err) {
      console.warn('[Financial OS State] LocalStorage restoration deferred:', err);
    }
  },

  /**
   * Subscribe to specific state change events
   * @param {string} event - Event type identifier
   * @param {Function} callback - Function executed on event emit
   */
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  /**
   * Mutate state parameters and notify subscribers
   * @param {Object} partialState - State properties to update
   */
  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    
    // Auto-persist parameter snapshots
    try {
      const paramsToPersist = {
        monthlySIP: this.state.monthlySIP,
        expectedReturn: this.state.expectedReturn,
        durationYears: this.state.durationYears,
        stepUpPercent: this.state.stepUpPercent,
        inflationRate: this.state.inflationRate,
        taxRate: this.state.taxRate
      };
      localStorage.setItem('fin_os_active_params', JSON.stringify(paramsToPersist));
    } catch (err) {
      // Non-blocking storage fallback
    }

    this.emit('STATE_CHANGE', this.state);
  },

  /**
   * Emit event notification to all registered callbacks
   * @param {string} event - Event name
   * @param {Object} data - Payload passed to subscribers
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  },

  /**
   * Save current state parameters as a named scenario
   * @param {string} scenarioName 
   */
  saveCurrentScenario(scenarioName) {
    const scenario = {
      id: 'scenario-' + Date.now(),
      name: scenarioName || `Plan ${this.state.savedScenarios.length + 1}`,
      timestamp: new Date().toISOString(),
      params: {
        monthlySIP: this.state.monthlySIP,
        expectedReturn: this.state.expectedReturn,
        durationYears: this.state.durationYears,
        stepUpPercent: this.state.stepUpPercent,
        inflationRate: this.state.inflationRate,
        taxRate: this.state.taxRate
      }
    };

    this.state.savedScenarios.unshift(scenario);
    
    try {
      localStorage.setItem('fin_os_scenarios', JSON.stringify(this.state.savedScenarios));
    } catch (err) {
      console.error('[Financial OS State] Failed to persist scenario:', err);
    }

    this.emit('SCENARIO_SAVED', this.state.savedScenarios);
  },

  /**
   * Delete a saved scenario by ID
   * @param {string} id 
   */
  deleteScenario(id) {
    this.state.savedScenarios = this.state.savedScenarios.filter(s => s.id !== id);
    try {
      localStorage.setItem('fin_os_scenarios', JSON.stringify(this.state.savedScenarios));
    } catch (err) {
      console.error('[Financial OS State] Failed to delete scenario:', err);
    }
    this.emit('SCENARIO_SAVED', this.state.savedScenarios);
  }
};

// Auto-initialize state store on file evaluation
Store.init();