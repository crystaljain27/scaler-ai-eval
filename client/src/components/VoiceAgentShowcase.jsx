import React, { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { Phone, PhoneOff, Settings, Check, Copy, AlertTriangle } from 'lucide-react';

// Default mock/placeholder IDs (user can configure via UI settings tab)
const DEFAULT_PUBLIC_KEY = 'aed23219-0fe8-4fcb-b3bd-f78202716656'; 
const DEFAULT_ASSISTANT_ID = 'eb6f797a-64cc-464e-9da0-44aaf1854976';
const VOICE_PHONE_NUMBER = '+1 (800) 555-0199'; // Mock/placeholder number (recruiter can configure real one in Vapi)

const VOICE_SYSTEM_PROMPT = `
You are the voice representative of Crystal Jain. Your goal is to represent her professionally and answer questions from recruiters about her background, projects, skills, and availability.

Keep your answers extremely concise, conversational, and natural (1-3 sentences max). Never use markdown, bullet points, or special characters in your speech.

Here are the facts you must stay grounded on:
- SDE Intern at Nablasol (March 2026 - Present).
- Frontend Intern at Mercato Agency (May 2025 - July 2025).
- Education: Graphic Era Hill University (CGPA 7.0), John Milton Agra (12th: 80.2%), Colonel's Brightland Agra (10th: 90.6%).
- Hackathon: Finalist in Hack Heist Hackathon 2025 for building a scalable AI Drone for Disaster Management.
- Ratings: LeetCode 1850+ (Top 7%), CodeChef 1810+, Codeforces 1680+ (Username: sweeny).
- Last commit on AI-Resume-Builder: "Update frontend demo link in README" with hash 08f9239.
- Last commit on Income-Predictor: "Update README with correct setup and usage details" with hash e1a5117.
- Last commit on QuickBlog-FullStack: "Updated client folder with latest changes" with hash 001c06d.
- Skills: MERN Stack (React, Node, Express, MongoDB), Next.js, JavaScript, Python, C++.

If you are asked about scheduling or booking an interview, say: "You can view my availability or book an interview using the chat interface or evals tab on this website."
`;

export default function VoiceAgentShowcase() {
  const [vapi, setVapi] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callStatus, setCallStatus] = useState('Disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom API configuration
  const [config, setConfig] = useState({
    publicKey: localStorage.getItem('vapi_pub_key') || '',
    assistantId: localStorage.getItem('vapi_assistant_id') || '',
    phoneNumber: localStorage.getItem('vapi_phone_number') || VOICE_PHONE_NUMBER
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Instantiate Vapi with the current public key
    const activeKey = config.publicKey || DEFAULT_PUBLIC_KEY;
    const VapiConstructor = Vapi.default || Vapi;
    const vapiInstance = new VapiConstructor(activeKey);
    
    vapiInstance.on('call-start', () => {
      console.log('[Vapi] Call started successfully.');
      setCallActive(true);
      setCallStatus('Connected');
    });

    vapiInstance.on('call-end', () => {
      console.log('[Vapi] Call ended.');
      setCallActive(false);
      setCallStatus('Disconnected');
    });

    vapiInstance.on('speech-start', () => {
      setCallStatus('Crystal is speaking...');
    });

    vapiInstance.on('speech-end', () => {
      setCallStatus('Listening...');
    });

    vapiInstance.on('error', (err) => {
      console.error('[Vapi] SDK Error full object:', err);
      let detail = 'Unknown Error';
      try {
        detail = err?.error?.message || err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      } catch(e) { detail = String(err); }
      setErrorMsg(`Vapi Error: ${detail}`);
      setCallStatus('Connection Error');
      setCallActive(false);
    });

    setVapi(vapiInstance);

    return () => {
      vapiInstance.stop();
    };
  }, [config.publicKey]);

  const handleToggleCall = async () => {
    if (!vapi) return;

    if (callActive) {
      vapi.stop();
    } else {
      setCallStatus('Connecting...');
      const assistantId = config.assistantId || DEFAULT_ASSISTANT_ID;

      try {
        setErrorMsg('');
        console.log('[Vapi] Starting call with assistantId:', assistantId);
        // Using only assistantId to avoid Vapi API validation errors on model overrides.
        // The persona MUST be configured on the Vapi dashboard.
        await vapi.start(assistantId);
      } catch (err) {
        console.error('Failed to start call:', err);
        const detail = err?.message || JSON.stringify(err);
        setErrorMsg(`Start Error: ${detail}`);
        setCallStatus('Initialization Failed');
      }
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(config.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('vapi_pub_key', config.publicKey);
    localStorage.setItem('vapi_assistant_id', config.assistantId);
    localStorage.setItem('vapi_phone_number', config.phoneNumber);
    setShowConfig(false);
    alert('Configuration saved! Using new Vapi credentials.');
  };

  return (
    <div className="tab-scroll-container" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div className="chat-header" style={{ marginBottom: '24px' }}>
        <h3>Voice Agent Representative</h3>
        <button className="btn btn-secondary" onClick={() => setShowConfig(!showConfig)}>
          <Settings size={16} /> Configure API
        </button>
      </div>

      {showConfig && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '14px' }}>Vapi voice configuration</h4>
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vapi Public Key</label>
              <input 
                type="text" 
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '6px', color: 'white' }}
                value={config.publicKey} 
                onChange={e => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                placeholder="Enter Vapi Public Key (starts with pk_)"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assistant ID</label>
              <input 
                type="text" 
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '6px', color: 'white' }}
                value={config.assistantId} 
                onChange={e => setConfig(prev => ({ ...prev, assistantId: e.target.value }))}
                placeholder="Enter Assistant ID"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number (Twilio bound)</label>
              <input 
                type="text" 
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '6px', color: 'white' }}
                value={config.phoneNumber} 
                onChange={e => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Configuration</button>
          </form>
        </div>
      )}

      {/* Main Call Showcase Panel */}
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>
          Vapi Live Integration
        </div>

        <div style={{ margin: '24px 0 32px' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-teal) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: callActive ? '0 0 35px var(--accent-violet-glow)' : 'none', transition: 'all 0.5s ease' }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '3rem', animation: callActive ? 'typing 1.2s infinite ease-in-out alternate' : 'none' }}>👩‍💻</div>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Call Crystal Jain's AI Representative</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 24px' }}>
          Test the voice persona directly in your web browser or dial the dedicated phone number below.
        </p>

        {/* Browser Web Call Buttons */}
        <div style={{ marginBottom: '32px' }}>
          <button 
            onClick={handleToggleCall} 
            className={`btn ${callActive ? 'btn-secondary' : 'btn-primary'}`} 
            style={{ padding: '14px 28px', fontSize: '1rem', width: '200px', borderColor: callActive ? 'var(--accent-pink)' : 'transparent' }}
          >
            {callActive ? (
              <>
                <PhoneOff size={18} style={{ color: 'var(--accent-pink)' }} /> End Call
              </>
            ) : (
              <>
                <Phone size={18} /> Start Web Call
              </>
            )}
          </button>
          
          <p style={{ color: callActive ? 'var(--accent-teal)' : (callStatus === 'Connection Error' || callStatus === 'Initialization Failed') ? '#f87171' : 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px', fontWeight: '500' }}>
            Status: {callStatus}
          </p>
          {errorMsg && (
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', textAlign: 'left', fontSize: '0.78rem', color: '#f87171', maxWidth: '420px', margin: '10px auto 0', wordBreak: 'break-word' }}>
              <strong>⚠ Error Detail:</strong><br />{errorMsg}
            </div>
          )}
        </div>

        {/* Dedicated Phone Line Card */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '380px', margin: '0 auto' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recruiter Direct Line</span>
            <strong style={{ fontSize: '1.1rem', color: 'white' }}>{config.phoneNumber}</strong>
          </div>
          <button className="btn btn-secondary" onClick={handleCopyNumber} style={{ padding: '8px 12px' }}>
            {copied ? <Check size={16} style={{ color: 'var(--accent-teal)' }} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginTop: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <AlertTriangle size={20} style={{ color: 'var(--accent-teal)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ textAlign: 'left', fontSize: '0.85rem' }}>
          <h4 style={{ marginBottom: '4px', color: 'var(--text-main)' }}>Prerequisites for voice operations</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            To bind a custom voice agent, create an account on <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-teal)' }}>Vapi.ai</a>, create an assistant with System Prompt configured, and link your Twilio number. Use the "Configure API" option above to store your private identifiers locally.
          </p>
        </div>
      </div>
    </div>
  );
}
