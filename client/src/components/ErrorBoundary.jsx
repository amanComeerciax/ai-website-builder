import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Caught a rendering error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem', color: '#ff6b6b', background: '#1e1e24', 
                    height: '100%', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif'
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Preview Component Crashed</h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '400px', textAlign: 'center', margin: '0.5rem 0 1.5rem', color: 'rgba(255,255,255,0.7)' }}>
                        The built-in code preview threw an exception. This is usually caused by unparseable files or corrupted AI outputs.
                    </p>
                    <pre style={{ 
                        fontSize: '0.75rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.5)', 
                        padding: '1rem', borderRadius: '4px', maxWidth: '80%', overflowX: 'auto',
                        color: '#ff8a8a', border: '1px solid rgba(255,107,107,0.2)'
                    }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button 
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{ 
                            marginTop: '1.5rem', padding: '0.5rem 1rem', background: 'white', 
                            color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontWeight: 500, fontSize: '0.9rem'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
