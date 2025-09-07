import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const baseClasses = 'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-base sm:text-sm md:text-base';
  
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px] sm:py-2.5 sm:min-h-[44px]',
    lg: 'px-5 py-4 text-lg min-h-[52px] sm:py-3 sm:min-h-[48px]',
  };

  const stateClasses = error 
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20'
    : focused
    ? 'border-primary-300 focus:border-primary-500 focus:ring-primary-500/20'
    : 'border-neutral-300 hover:border-neutral-400';

  const disabledClasses = disabled 
    ? 'bg-base-200 text-neutral-500 cursor-not-allowed'
    : 'bg-base-100 text-neutral-900 dark:text-neutral-100';

  const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
  const passwordToggleClasses = type === 'password' ? 'pr-10' : '';

  const inputClasses = `
    ${baseClasses}
    ${sizes[size]}
    ${stateClasses}
    ${disabledClasses}
    ${iconClasses}
    ${passwordToggleClasses}
    ${className}
  `.trim();

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <div className="space-y-2">
      {label && (
        <motion.label
          className={`block text-sm font-medium ${error ? 'text-error-700' : 'text-neutral-700'}`}
          animate={{ color: error ? '#b91c1c' : focused ? '#4f46e5' : '#374151' }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
            <div className={`${error ? 'text-error-400' : focused ? 'text-primary-500' : 'text-neutral-400'} transition-colors duration-200`}>
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </motion.div>
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2 text-sm ${error ? 'text-error-600' : 'text-neutral-600'}`}
          >
            {error && <AlertCircle size={14} />}
            <span>{error || helperText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
};

export default Input;
