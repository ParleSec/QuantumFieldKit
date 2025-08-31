import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Card } from 'react-bootstrap';

const PluginResultsPanel = ({ result, loading }) => {
  const [activeTab, setActiveTab] = useState('visualization');

  return (
    <Card className="plugin-results-panel mb-4">
      <Card.Header>
        <Tabs
          id="plugin-results-tabs"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-0"
        >
          <Tab eventKey="visualization" title="Visualization" />
          <Tab eventKey="raw" title="Raw Data" />
          <Tab eventKey="log" title="Process Log" />
        </Tabs>
      </Card.Header>
      <Card.Body>
        {loading && <div className="text-center text-muted">Processing...</div>}
        {!loading && result && (
          <>
            {activeTab === 'visualization' && (
              <>
                {result.output && result.output.circuit_svg && (
                  <div className="mb-3">
                    <div
                      className="circuit-svg"
                      style={{
                        backgroundColor: '#fff',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        overflow: 'auto',
                        maxWidth: '100%'
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: result.output.circuit_svg }}
                        style={{
                          display: 'inline-block',
                          maxWidth: '100%',
                          height: 'auto'
                        }}
                      />
                    </div>
                  </div>
                )}
                {result.output && result.output.probabilities && (
                  <div className="mb-3">
                    {/* Render probability distribution as a bar chart if available */}
                    {/* You can use a chart library or a simple table here */}
                    <h6>Probability Distribution</h6>
                    <pre style={{ background: '#f8f9fa', padding: '1em', borderRadius: '6px' }}>{JSON.stringify(result.output.probabilities, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
            {activeTab === 'raw' && (
              <pre style={{ background: '#f8f9fa', padding: '1em', borderRadius: '6px' }}>{JSON.stringify(result.output, null, 2)}</pre>
            )}
            {activeTab === 'log' && (
              <pre style={{ background: '#f8f9fa', padding: '1em', borderRadius: '6px' }}>{result.log || 'No log available.'}</pre>
            )}
          </>
        )}
        {!loading && !result && <div className="text-center text-muted">No results yet.</div>}
      </Card.Body>
    </Card>
  );
};

PluginResultsPanel.propTypes = {
  result: PropTypes.object,
  loading: PropTypes.bool,
};

export default PluginResultsPanel; 