import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { UserError } from '@/lib/errors';

interface ErrorNotificationProps {
  error: UserError | null;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorNotification({ error, onDismiss, className = '' }: ErrorNotificationProps) {
  if (!error) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <Info className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border
        ${getBackgroundColor()}
        ${className}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 pt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${getTextColor()}`}>
          {error.message}
        </p>
        {error.code && (
          <p className={`text-xs mt-1 opacity-75 ${getTextColor()}`}>
            Error code: {error.code}
          </p>
        )}
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`
            flex-shrink-0 p-1 rounded-md transition-colors
            hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${error.type === 'error' ? 'focus:ring-red-500' : 
              error.type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}
          `}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: UserError | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ onError?: (error: UserError) => void }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ onError?: (error: UserError) => void }>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: {
        message: 'Something went wrong. Please refresh the page and try again.',
        type: 'error',
        code: 'REACT_ERROR'
      }
    };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, _errorInfo);
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-64 flex items-center justify-center p-8">
          <ErrorNotification
            error={this.state.error}
            onDismiss={() => this.setState({ hasError: false, error: null })}
            className="max-w-md"
          />
        </div>
      );
    }

    return this.props.children;
  }
}