import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500 shadow-sm hover:shadow-md border-0',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500 shadow-sm hover:shadow-md border-0',
    outline: 'border-2 border-primary-500 bg-transparent hover:bg-primary-500 text-primary-500 hover:text-white focus:ring-primary-500 shadow-sm',
    ghost: 'hover:bg-primary-100 hover:text-primary-700 text-current focus:ring-primary-500 border-0',
    danger: 'bg-error-500 hover:bg-error-600 text-white focus:ring-error-500 shadow-sm hover:shadow-md border-0',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm gap-1.5 min-h-[44px] sm:py-1.5 sm:min-h-[36px]',
    md: 'px-4 py-3 text-base gap-2 min-h-[48px] sm:py-2 sm:min-h-[40px]',
    lg: 'px-6 py-4 text-lg gap-2.5 min-h-[52px] sm:py-3 sm:min-h-[44px]',
    xl: 'px-8 py-5 text-xl gap-3 min-h-[56px] sm:py-4 sm:min-h-[48px]',
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const content = (
    <>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && icon}
    </>
  );

  return (
    <motion.button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {content}
    </motion.button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
