const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BOOKINGS_FILE = path.join(__dirname, '..', 'data', 'bookings.json');

// Ensure database file exists
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.mkdirSync(path.dirname(BOOKINGS_FILE), { recursive: true });
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
}

/**
 * Reads bookings from the JSON file database.
 */
function readBookings() {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading bookings:', err);
    return [];
  }
}

/**
 * Saves a new booking to the JSON file database.
 */
function saveBooking(booking) {
  try {
    const bookings = readBookings();
    bookings.push(booking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving booking:', err);
    return false;
  }
}

/**
 * Generates standard work slots for a date (Monday to Friday, 9 AM to 5 PM).
 */
function getStandardSlots(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  // Weekend: no slots
  if (day === 0 || day === 6) {
    return [];
  }

  // Define 5 standard slots:
  return [
    '10:00 AM',
    '11:30 AM',
    '02:00 PM',
    '03:30 PM',
    '04:30 PM'
  ];
}

/**
 * Service class to manage bookings and availability.
 */
class CalendarService {
  constructor() {
    this.calApiKey = process.env.CAL_API_KEY;
    this.calEventTypeId = process.env.CAL_EVENT_TYPE_ID;
    this.calUsername = process.env.CAL_USERNAME; // E.g., 'crystaljain'
  }

  isRealCalEnabled() {
    return !!(this.calApiKey && (this.calEventTypeId || this.calUsername));
  }

  /**
   * Get available slots for a specific date (YYYY-MM-DD).
   */
  async getAvailableSlots(dateStr) {
    if (this.isRealCalEnabled()) {
      try {
        console.log(`[CalendarService] Fetching real slots from Cal.com v2 for date: ${dateStr}`);
        // Calculate start/end of the day in ISO
        const start = new Date(`${dateStr}T00:00:00`).toISOString();
        const end = new Date(`${dateStr}T23:59:59`).toISOString();
        
        // Cal.com v2 slots API endpoint
        const response = await axios.get('https://api.cal.com/v2/slots/available', {
          params: {
            eventTypeId: parseInt(this.calEventTypeId, 10),
            startTime: start,
            endTime: end
          },
          headers: {
            'Authorization': `Bearer ${this.calApiKey}`,
            'cal-api-version': '2024-08-13'
          }
        });

        // Parse slots from response
        const slotsData = response.data.data?.slots || {};
        const slotsForDate = slotsData[dateStr] || [];
        return slotsForDate.map(slot => {
          // Format slot time to HH:MM AM/PM
          const d = new Date(slot.time);
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        });
      } catch (err) {
        console.error('[CalendarService] Failed to fetch real slots from Cal.com, falling back to mock slots:', err.message);
      }
    }

    // Mock Mode fallback
    const allSlots = getStandardSlots(dateStr);
    if (allSlots.length === 0) return [];

    const bookings = readBookings();
    // Filter out slots already booked
    const bookedTimes = bookings
      .filter(b => b.date === dateStr)
      .map(b => b.time);

    return allSlots.filter(slot => !bookedTimes.includes(slot));
  }

  /**
   * Book an interview slot.
   */
  async bookInterview(name, email, dateStr, timeStr) {
    const cleanTime = timeStr.trim();
    
    if (this.isRealCalEnabled()) {
      try {
        console.log(`[CalendarService] Creating real booking on Cal.com v2 for ${name} at ${dateStr} ${cleanTime}`);
        
        // Parse timeStr (e.g. 10:00 AM) to ISO format
        const [time, modifier] = cleanTime.split(' ');
        let [hours, minutes] = time.split(':');
        if (modifier === 'PM' && hours !== '12') {
          hours = parseInt(hours, 10) + 12;
        }
        if (modifier === 'AM' && hours === '12') {
          hours = '00';
        }
        const isoStart = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`).toISOString();

        const response = await axios.post(`https://api.cal.com/v2/bookings`, {
          eventTypeId: parseInt(this.calEventTypeId, 10),
          start: isoStart,
          attendee: {
            name: name,
            email: email,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
          },
          metadata: {
            source: 'AI Persona Call/Chat'
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.calApiKey}`,
            'cal-api-version': '2024-08-13'
          }
        });

        if (response.data && response.data.status === 'success' && response.data.data) {
          const booking = response.data.data;
          const bookingData = {
            id: booking.id,
            name,
            email,
            date: dateStr,
            time: cleanTime,
            createdAt: new Date().toISOString(),
            status: 'confirmed',
            realCal: true
          };
          saveBooking(bookingData);
          return bookingData;
        }
      } catch (err) {
        console.error('[CalendarService] Cal.com booking failed, falling back to Mock Database:', err.response?.data || err.message);
      }
    }

    // Mock Mode fallback
    // Check if already booked in mock database
    const bookings = readBookings();
    const isBooked = bookings.some(b => b.date === dateStr && b.time === cleanTime);
    if (isBooked) {
      throw new Error(`Slot ${cleanTime} on ${dateStr} is already booked.`);
    }

    const newBooking = {
      id: 'mock-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      date: dateStr,
      time: cleanTime,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      realCal: false
    };

    const success = saveBooking(newBooking);
    if (!success) {
      throw new Error('Failed to save booking to local database.');
    }
    return newBooking;
  }

  /**
   * Get all confirmed bookings.
   */
  getAllBookings() {
    return readBookings();
  }
}

module.exports = new CalendarService();
