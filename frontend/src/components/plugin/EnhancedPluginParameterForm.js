import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Settings, HelpCircle, Zap } from 'lucide-react';
import PropTypes from 'prop-types';
import Button from '../../design-system/components/Button';
import Input from '../../design-system/components/Input';
import Card from '../../design-system/components/Card';

const EnhancedPluginParameterForm = ({ 
  parameters, 
  initialValues, 
  onSubmit, 
  loading,
  onParameterChange,
  showAdvanced = false 
}) => {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});
  const [showAdvancedParams, setShowAdvancedParams] = useState(showAdvanced);
  const [focusedParam, setFocusedParam] = useState(null);

  // Categorize parameters
  const { basicParams, advancedParams } = useMemo(() => {
    const basic = parameters.filter(p => !p.advanced);
    const advanced = parameters.filter(p => p.advanced);
    return { basicParams: basic, advancedParams: advanced };
  }, [parameters]);

  const validateParameter = useCallback((param, value) => {
    const errors = [];
    
    if (param.required && (value === undefined || value === null || value === '')) {
      errors.push('This field is required');
    }
    
    if (param.type === 'int' || param.type === 'float') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push('Must be a valid number');
      } else {
        if (param.min !== undefined && numValue < param.min) {
          errors.push(`Must be at least ${param.min}`);
        }
        if (param.max !== undefined && numValue > param.max) {
          errors.push(`Must be at most ${param.max}`);
        }
      }
    }
    
    if (param.type === 'string' && param.max_length && value.length > param.max_length) {
      errors.push(`Must be at most ${param.max_length} characters`);
    }
    
    return errors;
  }, []);

  const handleChange = useCallback((paramName, value) => {
    setValues(prev => {
      const newValues = { ...prev, [paramName]: value };
      
      // Validate the parameter
      const param = parameters.find(p => p.name === paramName);
      if (param) {
        const paramErrors = validateParameter(param, value);
        setErrors(prev => ({
          ...prev,
          [paramName]: paramErrors.length > 0 ? paramErrors[0] : undefined
        }));
      }
      
      onParameterChange?.(newValues);
      return newValues;
    });
  }, [parameters, validateParameter, onParameterChange]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Validate all parameters
    const newErrors = {};
    let hasErrors = false;
    
    parameters.forEach(param => {
      const paramErrors = validateParameter(param, values[param.name]);
      if (paramErrors.length > 0) {
        newErrors[param.name] = paramErrors[0];
        hasErrors = true;
      }
    });
    
    setErrors(newErrors);
    
    if (!hasErrors) {
      onSubmit(values);
    }
  }, [parameters, values, validateParameter, onSubmit]);

  const handleReset = useCallback(() => {
    setValues(initialValues || {});
    setErrors({});
  }, [initialValues]);

  const renderParameterInput = (param) => {
    const value = values[param.name] ?? param.default ?? '';
    const error = errors[param.name];
    const isFocused = focusedParam === param.name;

    const inputProps = {
      value,
      onChange: (e) => handleChange(param.name, e.target.value),
      onFocus: () => setFocusedParam(param.name),
      onBlur: () => setFocusedParam(null),
      error,
      required: param.required,
      disabled: loading,
    };

    switch (param.type) {
      case 'int':
      case 'float':
        return (
          <Input
            {...inputProps}
            type="number"
            label={param.description || param.name}
            helperText={`${param.type}${param.min !== undefined ? `, min: ${param.min}` : ''}${param.max !== undefined ? `, max: ${param.max}` : ''}`}
            min={param.min}
            max={param.max}
            step={param.type === 'float' ? 'any' : '1'}
          />
        );
      
      case 'bool':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              {param.description || param.name}
              {param.required && <span className="text-error-500 ml-1">*</span>}
            </label>
            <motion.button
              type="button"
              onClick={() => handleChange(param.name, !value)}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${value ? 'bg-primary-500' : 'bg-neutral-200'}
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <motion.span
                layout
                className="inline-block h-4 w-4 transform rounded-full bg-base-100 dark:bg-neutral-200 shadow-sm transition-transform"
                animate={{ x: value ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              {param.description || param.name}
              {param.required && <span className="text-error-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500"
            >
              {param.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      
      default:
        return (
          <Input
            {...inputProps}
            type="text"
            label={param.description || param.name}
            helperText={param.max_length ? `Max ${param.max_length} characters` : undefined}
            maxLength={param.max_length}
          />
        );
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="flex items-center gap-2">
            <Settings size={20} className="text-primary-500" />
            Parameters
          </Card.Title>
          {advancedParams.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedParams(!showAdvancedParams)}
            >
              Advanced {showAdvancedParams ? '−' : '+'}
            </Button>
          )}
        </div>
      </Card.Header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Parameters */}
        <div className="space-y-4">
          {basicParams.map((param) => (
            <motion.div
              key={param.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderParameterInput(param)}
            </motion.div>
          ))}
        </div>

        {/* Advanced Parameters */}
        <AnimatePresence>
          {showAdvancedParams && advancedParams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <HelpCircle size={16} />
                Advanced Parameters
              </div>
              {advancedParams.map((param) => (
                <motion.div
                  key={param.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderParameterInput(param)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<Zap size={16} />}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg min-h-[48px] sm:min-h-[44px]"
          >
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            icon={<RotateCcw size={16} />}
            className="border-2 border-neutral-400 hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-base-200 dark:hover:bg-neutral-700 min-h-[48px] sm:min-h-[44px] sm:flex-shrink-0"
          >
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
};

EnhancedPluginParameterForm.propTypes = {
  parameters: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onParameterChange: PropTypes.func,
  showAdvanced: PropTypes.bool,
};

export default EnhancedPluginParameterForm;
