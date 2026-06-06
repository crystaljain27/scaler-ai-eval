require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatService = require('./services/chatService');
const calendarService = require('./services/calendarService');
const voiceWebhookRouter = require('./routes/voiceWebhook');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Grounded chat endpoint
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: "messages" array is required.' });
  }

  try {
    const result = await chatService.handleChat(messages);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Failed to process chat conversation.' });
  }
});

// Calendar Slots check
app.get('/api/calendar/slots', async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  if (!date) {
    return res.status(400).json({ error: 'Query parameter "date" (YYYY-MM-DD) is required.' });
  }

  try {
    const slots = await calendarService.getAvailableSlots(date);
    return res.status(200).json({ slots });
  } catch (err) {
    console.error('Calendar slots check error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Calendar Book interview
app.post('/api/calendar/book', async (req, res) => {
  const { name, email, date, time } = req.body;
  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'Parameters "name", "email", "date", and "time" are all required.' });
  }

  try {
    const booking = await calendarService.bookInterview(name, email, date, time);
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    console.error('Calendar booking error:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Calendar Retrieve all bookings (for Admin Dashboard)
app.get('/api/calendar/bookings', (req, res) => {
  try {
    const bookings = calendarService.getAllBookings();
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Calendar bookings fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Voice webhooks router (Vapi)
app.use('/api/voice', voiceWebhookRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` SCALER AI Persona backend running on port ${PORT} `);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
