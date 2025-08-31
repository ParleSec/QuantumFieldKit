import { io } from 'socket.io-client';

const API_BASE_URL = '/api';
const socket = io();

// Helper function to check for HTML response
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response is HTML instead of JSON
  if (contentType && contentType.includes('text/html')) {
    const text = await response.text();
    const firstChars = text.substring(0, 30); // Get first 30 chars for error message
    throw new Error(`Received HTML instead of JSON: ${firstChars}...`);
  }
  
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.status}`);
    } catch (e) {
      // If we can't parse the JSON, throw the original response text
      const text = await response.text();
      throw new Error(`API error (${response.status}): ${text.substring(0, 100)}...`);
    }
  }
  
  return response.json();
};

export const fetchPlugins = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/plugins`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching plugins:', error);
    throw error;
  }
};

export const fetchPlugin = async (pluginKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/plugin/${pluginKey}`);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching plugin ${pluginKey}:`, error);
    throw error;
  }
};

export const runPlugin = async (pluginKey, params, onProgress) => {
  return new Promise((resolve, reject) => {
    // Set up socket event listeners
    socket.on('plugin_progress', (data) => {
      if (data.plugin_key === pluginKey && onProgress) {
        onProgress(data.progress, data.message);
      }
    });

    socket.on('plugin_result', (data) => {
      if (data.plugin_key === pluginKey) {
        resolve(data.result);
      }
    });

    socket.on('plugin_error', (data) => {
      if (data.plugin_key === pluginKey) {
        reject(new Error(data.error));
      }
    });

    // Emit the run_plugin event
    socket.emit('run_plugin', {
      plugin_key: pluginKey,
      params: params
    });
  });
};

export const fetchGlossary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/glossary`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching glossary:', error);
    throw error;
  }
};

export const fetchCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/category/${category}`);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching category ${category}:`, error);
    throw error;
  }
};

export const fetchEducationalContent = async (pluginKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/educational/${pluginKey}`);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching educational content for ${pluginKey}:`, error);
    throw error;
  }
};

export const validateParameters = async (pluginKey, params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate/${pluginKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error validating parameters for ${pluginKey}:`, error);
    throw error;
  }
};

// Circuit Designer API Services

export const getAvailableGates = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/circuit/gates`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching available gates:', error);
    throw error;
  }
};

export const runCircuitSimulation = async (circuit, shots) => {
  try {
    const response = await fetch(`${API_BASE_URL}/circuit/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ circuit, shots }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error running circuit simulation:', error);
    throw error;
  }
};

export const saveCircuit = async (circuitData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/circuit/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(circuitData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error saving circuit:', error);
    throw error;
  }
};

export const loadCircuit = async (circuitId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/circuit/load/${circuitId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error loading circuit ${circuitId}:`, error);
    throw error;
  }
};

export const getSavedCircuits = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/circuit/saved`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching saved circuits:', error);
    throw error;
  }
};

export const exportCircuitCode = async (circuit, format = 'cirq') => {
  try {
    const response = await fetch(`${API_BASE_URL}/circuit/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ circuit, format }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error exporting circuit code:', error);
    throw error;
  }
}; 