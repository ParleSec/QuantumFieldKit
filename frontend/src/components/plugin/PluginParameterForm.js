import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'react-bootstrap';

const PluginParameterForm = ({ parameters, initialValues, onSubmit, loading }) => {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});

  const handleChange = (e, param) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    onSubmit(values);
  };

  return (
    <Form onSubmit={handleSubmit} className="plugin-parameter-form">
      {parameters.map((param) => (
        <Form.Group className="mb-3" controlId={`param-${param.name}`} key={param.name}>
          <Form.Label>{param.description || param.name} {param.type === 'int' && <span className="text-muted">(int{param.min !== undefined ? `, min: ${param.min}` : ''}{param.max !== undefined ? `, max: ${param.max}` : ''})</span>} {param.type === 'float' && <span className="text-muted">(float{param.min !== undefined ? `, min: ${param.min}` : ''}{param.max !== undefined ? `, max: ${param.max}` : ''})</span>}</Form.Label>
          {param.type === 'int' || param.type === 'float' ? (
            <Form.Control
              type="number"
              name={param.name}
              value={values[param.name] ?? param.default ?? ''}
              min={param.min}
              max={param.max}
              step={param.type === 'float' ? 'any' : '1'}
              onChange={(e) => handleChange(e, param)}
              required={param.default === undefined}
            />
          ) : param.type === 'bool' ? (
            <Form.Check
              type="checkbox"
              name={param.name}
              label="Yes"
              checked={!!values[param.name]}
              onChange={(e) => handleChange(e, param)}
            />
          ) : param.type === 'select' ? (
            <Form.Select
              name={param.name}
              value={values[param.name] ?? param.default ?? ''}
              onChange={(e) => handleChange(e, param)}
            >
              {param.options.map((opt) => (
                <option value={opt} key={opt}>{opt}</option>
              ))}
            </Form.Select>
          ) : (
            <Form.Control
              type="text"
              name={param.name}
              value={values[param.name] ?? param.default ?? ''}
              maxLength={param.max_length}
              onChange={(e) => handleChange(e, param)}
              required={param.default === undefined}
            />
          )}
          {errors[param.name] && <Form.Text className="text-danger">{errors[param.name]}</Form.Text>}
        </Form.Group>
      ))}
      <Button variant="primary" type="submit" disabled={loading} className="w-100 mb-2">
        {loading ? 'Running...' : 'Run Simulation'}
      </Button>
      <Button variant="outline-secondary" type="button" className="w-100" onClick={() => setValues(initialValues || {})}>
        Reset Parameters
      </Button>
    </Form>
  );
};

PluginParameterForm.propTypes = {
  parameters: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default PluginParameterForm; 