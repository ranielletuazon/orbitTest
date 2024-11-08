import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught an error:", error, errorInfo);
    if (error.message.includes("<Navigate> may be used only in the context of a <Router>")) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Optional: Render a fallback UI if needed
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
