import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import VoiceAgentShowcase from './components/VoiceAgentShowcase';
import Dashboard from './components/Dashboard';
import { MessageSquare, Mic, BarChart3, Terminal } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', margin: '20px auto', maxWidth: '600px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '8px' }}>View Rendering Failed</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>An unexpected error occurred while loading this panel:</p>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '12px', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem', color: '#f87171' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', maxHeight: '200px', overflowY: 'auto', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
            {this.state.error?.stack}
          </pre>
          <button className="btn btn-secondary" style={{ marginTop: '16px', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => window.location.reload()}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'voice' | 'dashboard'

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;

    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
      if (document.body && document.body.scrollTop !== 0) {
        document.body.scrollTop = 0;
      }
      if (document.documentElement && document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0;
      }
      const rootEl = document.getElementById('root');
      if (rootEl && rootEl.scrollTop !== 0) {
        rootEl.scrollTop = 0;
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  return (
    <div className="app-container">
      {/* Background Radial Glows */}
      <div className="radial-glow glow-top-right"></div>
      <div className="radial-glow glow-bottom-left"></div>

      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <div className="logo-icon">C</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
              Crystal <span style={{ color: 'var(--accent-teal)' }}>AI</span>
            </h2>
          </div>

          <nav className="nav-links">
            <div 
              className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={18} />
              <span>Grounded Chat</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              <Mic size={18} />
              <span>Voice Agent</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={18} />
              <span>Evals & Bookings</span>
            </div>
          </nav>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p>Version 1.0.0</p>
          <p style={{ marginTop: '2px' }}>Grounded on RAG Corpus</p>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <ErrorBoundary>
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'voice' && <VoiceAgentShowcase />}
          {activeTab === 'dashboard' && <Dashboard />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
