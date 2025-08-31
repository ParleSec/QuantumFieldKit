import React from 'react';
import PropTypes from 'prop-types';
import { Card, Alert } from 'react-bootstrap';

const PluginExplanation = ({ educationalContent, miniExplanation, onLearnMore }) => (
  <div className="plugin-explanation">
    {miniExplanation && (
      <Alert variant="info" className="mb-3">
        <div dangerouslySetInnerHTML={{ __html: miniExplanation }} />
        {onLearnMore && (
          <div className="text-end mt-2">
            <button className="btn btn-link btn-sm" onClick={onLearnMore}>
              Learn More
            </button>
          </div>
        )}
      </Alert>
    )}
    {educationalContent && (
      <Card className="mb-3">
        <Card.Body>
          <div dangerouslySetInnerHTML={{ __html: educationalContent }} />
        </Card.Body>
      </Card>
    )}
  </div>
);

PluginExplanation.propTypes = {
  educationalContent: PropTypes.string,
  miniExplanation: PropTypes.string,
  onLearnMore: PropTypes.func,
};

export default PluginExplanation; 