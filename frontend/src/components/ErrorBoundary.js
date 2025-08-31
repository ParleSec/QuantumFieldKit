import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
      // Here you would typically send to error monitoring service
      // e.g., Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card variant="elevated" padding="lg" className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertTriangle size={32} className="text-error-500" />
              </motion.div>

              <Card.Title className="text-xl mb-2">
                Oops! Something went wrong
              </Card.Title>

              <Card.Description className="mb-6">
                We encountered an unexpected error. This has been logged and our team will investigate.
              </Card.Description>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-neutral-50 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-error-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={this.handleRetry}
                  icon={<RefreshCw size={16} />}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  icon={<Home size={16} />}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>

              {this.state.retryCount > 2 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-neutral-600 mt-4"
                >
                  Still having issues? Try refreshing the page or contact support.
                </motion.p>
              )}
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
