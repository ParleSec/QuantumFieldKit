import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'rounded-xl border transition-all duration-200';
  
  const variants = {
    default: 'border-neutral-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-800',
    elevated: 'border-neutral-200 dark:border-neutral-700 shadow-md bg-white dark:bg-neutral-800',
    outlined: 'border-neutral-300 dark:border-neutral-600 shadow-none bg-white dark:bg-neutral-800',
    glass: 'border-white/20 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-lg',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverClasses}
    ${className}
  `.trim();

  const CardComponent = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -4, transition: { type: "spring", stiffness: 300 } },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {};

  return (
    <CardComponent
      ref={ref}
      className={classes}
      {...motionProps}
      {...props}
    >
      {children}
    </CardComponent>
  );
});

Card.displayName = 'Card';

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`pb-3 sm:pb-4 border-b border-neutral-200 mb-4 sm:mb-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-neutral-600 dark:text-neutral-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`pt-4 border-t border-neutral-200 mt-6 ${className}`} {...props}>
    {children}
  </div>
);

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'glass']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  hover: PropTypes.bool,
  className: PropTypes.string,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
