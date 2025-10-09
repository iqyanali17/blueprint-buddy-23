import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg mx-auto shadow-medical border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-destructive to-warning rounded-full flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
              <Badge variant="destructive" className="mb-2">
                Application Error
              </Badge>
              <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page or return to the home page.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium text-sm mb-2 text-destructive">Error Details (Development Mode):</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={this.handleRetry}
                  variant="medical" 
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline" 
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  If this problem persists, please contact support for assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;