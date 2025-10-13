import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="mb-6">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              We encountered an unexpected error. This might be a temporary issue.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={this.handleRetry} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-8 p-4 bg-muted rounded-lg text-left max-w-2xl">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-muted-foreground overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
