import React, { useState, useRef, useEffect } from 'react';
import { Send, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000'; // Fallback to local server

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: "Hi! I am the AI representative of Crystal Jain. You can ask me questions about her experience as an SDE intern, her projects (AI Resume Builder, QuickBlog, Income Predictor), hackathons, or competitive programming ratings. If you'd like to schedule an interview, just let me know!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // Used to hold active slot booking card
  const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', time: '' });
  
  const chatMessagesRef = useRef(null);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);
    setActiveAction(null); // Clear previous actions

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'model', content: data.text }]);
      
      if (data.action) {
        console.log('[ChatInterface] Received action handler:', data.action);
        setActiveAction(data.action);
        if (data.action.type === 'slots') {
          setBookingDetails(prev => ({ ...prev, time: '' }));
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I had trouble reaching the server. Please verify the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.time) {
      alert('Please fill out all fields and select a slot.');
      return;
    }

    setLoading(true);
    const date = activeAction.data.date;
    const { name, email, time } = bookingDetails;

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date, time })
      });

      const resData = await response.json();
      
      if (resData.success) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'model', 
            content: `Great! I've booked your interview for ${date} at ${time}. A calendar confirmation has been registered.` 
          }
        ]);
        setActiveAction({
          type: 'booking_success',
          data: resData.booking
        });
      } else {
        setMessages(prev => [
          ...prev,
          { 
            role: 'model', 
            content: `I'm sorry, booking failed: ${resData.error || 'Unknown error'}. Please pick another slot.` 
          }
        ]);
        setActiveAction(null);
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="profile-info">
          <div className="avatar">
            <div style={{ fontSize: '1.4rem' }}>💎</div>
          </div>
          <div>
            <h3>Crystal Jain <span className="status-dot"></span></h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>AI representative • Grounded Persona</p>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`message ${m.role === 'user' ? 'message-user' : 'message-model'}`}>
            <div className="message-bubble">{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="message message-model">
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        {/* Dynamic Booking Action Card */}
        {activeAction && activeAction.type === 'slots' && (
          <div className="calendar-card glass-panel pulse" style={{ maxWidth: '480px', alignSelf: 'flex-start', marginLeft: '12px' }}>
            <h4><Calendar size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Select an Interview Slot on {activeAction.data.date}</h4>
            
            {activeAction.data.slots.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No slots available on this day. Please try another date.</p>
            ) : (
              <>
                <div className="slots-grid">
                  {activeAction.data.slots.map((slot, sIdx) => (
                    <div 
                      key={sIdx} 
                      className={`slot-btn ${bookingDetails.time === slot ? 'selected' : ''}`}
                      onClick={() => setBookingDetails(prev => ({ ...prev, time: slot }))}
                    >
                      {slot}
                    </div>
                  ))}
                </div>

                {bookingDetails.time && (
                  <form onSubmit={handleBookSlot} className="booking-form">
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      required 
                      value={bookingDetails.name}
                      onChange={e => setBookingDetails(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input 
                      type="email" 
                      placeholder="Your Email" 
                      required 
                      value={bookingDetails.email}
                      onChange={e => setBookingDetails(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                      Confirm Booking
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* Booking Confirmation State */}
        {activeAction && activeAction.type === 'booking_success' && (
          <div className="calendar-card glass-panel" style={{ maxWidth: '400px', alignSelf: 'flex-start', marginLeft: '12px', borderColor: 'var(--accent-teal)' }}>
            <h4 style={{ color: 'var(--accent-teal)' }}>
              <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> 
              Interview Booked!
            </h4>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
              <strong>Date:</strong> {activeAction.data.date}<br />
              <strong>Time:</strong> {activeAction.data.time}<br />
              <strong>Interviewer:</strong> {activeAction.data.name} ({activeAction.data.email})
            </p>
          </div>
        )}

      </div>

      <div className="chat-input-wrapper">
        <textarea
          className="chat-input"
          placeholder="Ask Crystal's AI representative about her skills, experience, or schedule an interview..."
          rows="1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="btn btn-primary btn-icon" onClick={() => handleSend()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
