/**
 * Souls v1 - Finite State Machine
 * Ferrofluid-inspired state visualization for AI Bradaa
 */

/**
 * Soul States
 * Visual representation of system health/activity
 */
export const SoulStates = {
  NEUTRAL: 'neutral',     // Default idle state
  AMBER: 'amber',         // Processing/thinking
  GREEN: 'green',         // Success/healthy
  RED: 'red',             // Error/warning
};

/**
 * Soul State Machine
 */
export class SoulFSM {
  constructor() {
    this.currentState = SoulStates.NEUTRAL;
    this.stateHistory = [];
    this.transitionCallbacks = new Map();
    this.stateData = {};
  }

  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get state data (metadata about current state)
   */
  getStateData() {
    return this.stateData;
  }

  /**
   * Transition to new state
   */
  transition(newState, data = {}) {
    const oldState = this.currentState;

    // Validate state
    if (!Object.values(SoulStates).includes(newState)) {
      console.error(`Invalid state: ${newState}`);
      return false;
    }

    // Check if transition is allowed
    if (!this.isTransitionAllowed(oldState, newState)) {
      console.warn(`Transition ${oldState} → ${newState} not allowed`);
      return false;
    }

    // Update state
    this.currentState = newState;
    this.stateData = data;

    // Log history
    this.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      data,
    });

    // Trim history to last 50 entries
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }

    // Fire callbacks
    this.fireTransitionCallbacks(oldState, newState, data);

    return true;
  }

  /**
   * Check if transition is allowed
   */
  isTransitionAllowed(from, to) {
    // All states can transition to neutral
    if (to === SoulStates.NEUTRAL) return true;

    // Define allowed transitions
    const allowedTransitions = {
      [SoulStates.NEUTRAL]: [SoulStates.AMBER, SoulStates.GREEN, SoulStates.RED],
      [SoulStates.AMBER]: [SoulStates.GREEN, SoulStates.RED, SoulStates.NEUTRAL],
      [SoulStates.GREEN]: [SoulStates.NEUTRAL, SoulStates.AMBER],
      [SoulStates.RED]: [SoulStates.NEUTRAL, SoulStates.AMBER],
    };

    return allowedTransitions[from]?.includes(to) || false;
  }

  /**
   * Register callback for state transitions
   */
  onTransition(callback) {
    const id = `callback-${Date.now()}-${Math.random()}`;
    this.transitionCallbacks.set(id, callback);
    return id; // Return ID for unregistering
  }

  /**
   * Unregister callback
   */
  offTransition(id) {
    return this.transitionCallbacks.delete(id);
  }

  /**
   * Fire all registered callbacks
   */
  fireTransitionCallbacks(from, to, data) {
    this.transitionCallbacks.forEach((callback) => {
      try {
        callback(from, to, data);
      } catch (error) {
        console.error('Transition callback error:', error);
      }
    });
  }

  /**
   * Get state history
   */
  getHistory(limit = 10) {
    return this.stateHistory.slice(-limit);
  }

  /**
   * Reset to neutral
   */
  reset() {
    this.transition(SoulStates.NEUTRAL, {});
  }
}

/**
 * Smart state manager with auto-transitions
 */
export class SoulManager {
  constructor() {
    this.fsm = new SoulFSM();
    this.timers = new Map();
  }

  /**
   * Handle API call start
   */
  onApiStart(requestId) {
    this.fsm.transition(SoulStates.AMBER, {
      type: 'api-call',
      requestId,
      startTime: Date.now(),
    });
  }

  /**
   * Handle API call success
   */
  onApiSuccess(requestId, latency) {
    this.fsm.transition(SoulStates.GREEN, {
      type: 'api-success',
      requestId,
      latency,
    });

    // Auto-return to neutral after 2s
    this.scheduleTransition(SoulStates.NEUTRAL, 2000, {
      type: 'auto-reset',
    });
  }

  /**
   * Handle API call error
   */
  onApiError(requestId, error) {
    this.fsm.transition(SoulStates.RED, {
      type: 'api-error',
      requestId,
      error: error.message || 'Unknown error',
    });

    // Auto-return to neutral after 5s
    this.scheduleTransition(SoulStates.NEUTRAL, 5000, {
      type: 'auto-reset-after-error',
    });
  }

  /**
   * Schedule a state transition
   */
  scheduleTransition(state, delay, data) {
    // Clear any existing timer
    this.clearScheduledTransition();

    // Set new timer
    const timerId = setTimeout(() => {
      this.fsm.transition(state, data);
      this.timers.delete('scheduled');
    }, delay);

    this.timers.set('scheduled', timerId);
  }

  /**
   * Clear scheduled transition
   */
  clearScheduledTransition() {
    const timerId = this.timers.get('scheduled');
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete('scheduled');
    }
  }

  /**
   * Get current soul state
   */
  getState() {
    return this.fsm.getState();
  }

  /**
   * Get state data
   */
  getStateData() {
    return this.fsm.getStateData();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    return this.fsm.onTransition(callback);
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(id) {
    return this.fsm.offTransition(id);
  }
}

export default SoulManager;
