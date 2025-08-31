import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PluginLayout from '../components/plugin/PluginLayout';
import PluginParameterForm from '../components/plugin/PluginParameterForm';
import PluginResultsPanel from '../components/plugin/PluginResultsPanel';
import PluginExplanation from '../components/plugin/PluginExplanation';
import { fetchPlugin, runPlugin, fetchEducationalContent } from '../services/api';
import { Card, Spinner } from 'react-bootstrap';

const Plugin = () => {
  const { pluginKey } = useParams();
  const [plugin, setPlugin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [educationalContent, setEducationalContent] = useState('');
  const [miniExplanation, setMiniExplanation] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setResult(null);
    Promise.all([
      fetchPlugin(pluginKey),
      fetchEducationalContent(pluginKey),
    ])
      .then(([pluginData, eduData]) => {
        setPlugin(pluginData);
        setEducationalContent(eduData.content || '');
        // Optionally, fetch mini explanation if you have an endpoint for it
        setMiniExplanation(eduData.mini || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pluginKey]);

  const handleRun = async (params) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const simResult = await runPlugin(pluginKey, params);
      setResult(simResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sidebar = (
    <div>
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          {plugin ? plugin.name : 'Loading...'}
        </Card.Header>
        <Card.Body>
          <div className="mb-2 text-muted">{plugin && plugin.description}</div>
          {plugin && (
            <PluginParameterForm
              parameters={plugin.parameters}
              initialValues={plugin.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {})}
              onSubmit={handleRun}
              loading={loading}
            />
          )}
        </Card.Body>
      </Card>
      <Card className="mb-4">
        <Card.Header>Navigation</Card.Header>
        <Card.Body>
          <div className="d-grid gap-2">
            <Link to="/" className="btn btn-outline-primary btn-sm">Back to Home</Link>
            <a href="https://github.com/parlesec/quantum-field-kit" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm">Documentation</a>
            <a href="https://quantum.country/qcvc" target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm">Learning Center</a>
            <Link to="/glossary" className="btn btn-outline-dark btn-sm">Quantum Computing Glossary</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <PluginLayout sidebar={sidebar}>
      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && (
        <div className="alert alert-danger my-4">{error}</div>
      )}
      {!loading && plugin && (
        <>
          <PluginResultsPanel result={result} loading={loading} />
          <PluginExplanation
            educationalContent={educationalContent}
            miniExplanation={miniExplanation}
            onLearnMore={null}
          />
        </>
      )}
    </PluginLayout>
  );
};

export default Plugin; 