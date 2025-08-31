import ReactGA from 'react-ga4';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.measurementId = 'G-SZH9MSH6K5';
  }

  /**
   * Initialize Google Analytics
   */
  initialize() {
    if (!this.measurementId) {
      console.warn('Google Analytics Measurement ID not found. Analytics will not be tracked.');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      ReactGA.initialize(this.measurementId, {
        debug: process.env.NODE_ENV === 'development',
        testMode: process.env.NODE_ENV === 'test',
        gtagOptions: {
          send_page_view: false
        }
      });
      
      this.isInitialized = true;
      console.log('Google Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * Track page views
   * @param {string} path - The page path
   * @param {string} title - The page title
   */
  trackPageView(path, title) {
    if (!this.isInitialized) return;

    try {
      ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track custom events
   * @param {string} action - The event action
   * @param {string} category - The event category
   * @param {string} label - The event label (optional)
   * @param {number} value - The event value (optional)
   */
  trackEvent(action, category, label = null, value = null) {
    if (!this.isInitialized) return;

    try {
      const eventParams = {
        action,
        category
      };

      if (label) eventParams.label = label;
      if (value !== null) eventParams.value = value;

      ReactGA.event(eventParams);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track plugin interactions
   * @param {string} pluginName - Name of the plugin
   * @param {string} action - The action performed (view, run, configure, etc.)
   * @param {Object} parameters - Additional parameters (optional)
   */
  trackPluginInteraction(pluginName, action, parameters = {}) {
    this.trackEvent(action, 'Plugin', pluginName);
    
    // Track additional parameters if provided
    if (Object.keys(parameters).length > 0) {
      this.trackEvent('plugin_parameters', 'Plugin', pluginName, Object.keys(parameters).length);
    }
  }

  /**
   * Track quantum simulation runs
   * @param {string} pluginName - Name of the plugin
   * @param {Object} config - Simulation configuration
   */
  trackSimulationRun(pluginName, config = {}) {
    this.trackEvent('simulation_run', 'Quantum', pluginName);
    
    // Track simulation complexity if available
    if (config.qubits) {
      this.trackEvent('simulation_qubits', 'Quantum', pluginName, config.qubits);
    }
    
    if (config.shots) {
      this.trackEvent('simulation_shots', 'Quantum', pluginName, config.shots);
    }
  }

  /**
   * Track user engagement with educational content
   * @param {string} contentType - Type of content (glossary, explanation, etc.)
   * @param {string} contentId - Identifier for the content
   */
  trackEducationalContent(contentType, contentId) {
    this.trackEvent('view_content', 'Education', `${contentType}_${contentId}`);
  }

  /**
   * Track errors
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   * @param {string} location - Where the error occurred
   */
  trackError(errorType, errorMessage, location) {
    this.trackEvent('error', 'Error', `${errorType}_${location}`);
  }

  /**
   * Track user preferences
   * @param {string} preference - The preference name
   * @param {string} value - The preference value
   */
  trackUserPreference(preference, value) {
    this.trackEvent('preference_change', 'User', `${preference}_${value}`);
  }

  /**
   * Track circuit designer usage
   * @param {string} action - The action performed (create, modify, run, etc.)
   * @param {Object} circuitData - Circuit information
   */
  trackCircuitDesigner(action, circuitData = {}) {
    this.trackEvent(action, 'Circuit_Designer', 'circuit_interaction');
    
    if (circuitData.gates) {
      this.trackEvent('circuit_gates', 'Circuit_Designer', 'gate_count', circuitData.gates);
    }
    
    if (circuitData.qubits) {
      this.trackEvent('circuit_qubits', 'Circuit_Designer', 'qubit_count', circuitData.qubits);
    }
  }
}

// Create and export a singleton instance
const analytics = new AnalyticsService();
export default analytics;
