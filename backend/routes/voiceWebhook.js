const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');

/**
 * Robust handler for Vapi tool-calls webhooks.
 * Supports standard Vapi schema where message.toolCalls array contains the functions.
 */
router.post('/webhook', async (req, res) => {
  console.log('[VoiceWebhook] Received webhook request:', JSON.stringify(req.body, null, 2));

  const payload = req.body;
  const message = payload.message || {};
  
  if (message.type === 'tool-calls') {
    const toolCalls = message.toolCalls || [];
    const results = [];

    for (const toolCall of toolCalls) {
      const toolId = toolCall.id;
      const fn = toolCall.function || {};
      const name = fn.name;
      // Vapi passes arguments either as an object or as a JSON string
      let args = fn.arguments || {};
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch (e) {
          console.error('[VoiceWebhook] Failed to parse arguments string:', args);
        }
      }

      console.log(`[VoiceWebhook] Executing tool: ${name} with args:`, args);
      let resultData;

      try {
        if (name === 'getAvailableSlots') {
          const slots = await calendarService.getAvailableSlots(args.date);
          resultData = { slots, date: args.date, message: `Here are the available slots for ${args.date}: ${slots.join(', ')}` };
        } else if (name === 'bookInterview') {
          const booking = await calendarService.bookInterview(args.name, args.email, args.date, args.time);
          resultData = { success: true, booking, message: `Successfully booked interview for ${args.name} on ${args.date} at ${args.time}` };
        } else {
          resultData = { error: `Unknown tool function name: ${name}` };
        }
      } catch (err) {
        console.error(`[VoiceWebhook] Error executing ${name}:`, err.message);
        resultData = { success: false, error: err.message };
      }

      results.push({
        toolCallId: toolId,
        result: resultData
      });
    }

    return res.status(200).json({ results });
  }

  // Fallback for simple direct calls (for testing or other platforms)
  const name = req.body.functionName || req.body.name;
  const args = req.body.arguments || req.body.args || {};
  
  if (name) {
    console.log(`[VoiceWebhook] Direct fallback route triggered for: ${name}`);
    // Merge req.body into args in case Vapi sends flat properties
    const finalArgs = { ...req.body, ...args };
    
    try {
      if (name === 'getAvailableSlots') {
        const slots = await calendarService.getAvailableSlots(finalArgs.date);
        return res.status(200).json({ slots, date: finalArgs.date });
      } else if (name === 'bookInterview') {
        const booking = await calendarService.bookInterview(finalArgs.name, finalArgs.email, finalArgs.date, finalArgs.time);
        return res.status(200).json({ success: true, booking });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid webhook payload. Could not identify any tool call or function.' });
});

module.exports = router;
