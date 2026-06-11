const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize bookings file if it doesn't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, '[]');
}

// Helper functions for JSON file operations
function readBookings() {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bookings:', error);
    return [];
  }
}

function writeBookings(bookings) {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing bookings:', error);
    return false;
  }
}

// API: Get all bookings
app.get('/api/bookings', (req, res) => {
  const bookings = readBookings();
  res.json(bookings);
});

// API: Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// API: Unbook a single instance of a recurring booking
app.post('/api/unbook-instance', (req, res) => {
  console.log('unbook-instance endpoint called');
  const { day, time, date } = req.body;
  
  if (!day || !time || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bookings = readBookings();
  
  // Find the recurring booking (match by day and time, ignore date since recurring bookings have a base date)
  const booking = bookings.find(b => b.day === day && b.time === time && b.is_recurring);
  
  console.log('Unbook instance request', { day, time, date, booking });
  
  if (!booking) {
    console.log('Recurring booking not found', { day, time, date, bookings });
    return res.status(404).json({ error: 'Recurring booking not found' });
  }
  
  // Add the date to exceptions if not already there
  if (!booking.exceptions) {
    booking.exceptions = [];
  }
  
  if (!booking.exceptions.includes(date)) {
    booking.exceptions.push(date);
  }
  
  if (writeBookings(bookings)) {
    res.json({ success: true, message: 'Instance unbooked successfully' });
  } else {
    res.status(500).json({ error: 'Failed to unbook instance' });
  }
});

// API: Book a slot
app.post('/api/book', (req, res) => {
  const { day, date, time, name, is_recurring } = req.body;
  
  if (!day || !time || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bookings = readBookings();
  
  // Remove any existing booking for this day/time (overwrite)
  // For recurring bookings, match by day and time
  // For one-time bookings, match by date and time
  const filteredBookings = bookings.filter(b => {
    if (is_recurring) {
      // If new booking is recurring, remove any existing recurring booking for this day/time
      return !(b.day === day && b.time === time && b.is_recurring);
    } else {
      // If new booking is one-time, remove any existing one-time booking for this date/time
      return !(b.date === date && b.time === time && !b.is_recurring);
    }
  });

  // Add new booking
  filteredBookings.push({ 
    day, 
    date: is_recurring ? null : (date || null), // Only store date for one-time bookings
    time, 
    name, 
    is_recurring: is_recurring || false,
    exceptions: [], // Track specific dates that are unbooked from recurring bookings
    created_at: new Date().toISOString() 
  });
  
  if (writeBookings(filteredBookings)) {
    res.json({ success: true, message: 'Slot booked successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// API: Unbook a specific slot
app.post('/api/unbook', (req, res) => {
  console.log('POST /api/unbook called');
  const { day, date, time } = req.body;
  
  console.log('Request body:', { day, date, time });
  
  if (!day || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bookings = readBookings();
  
  console.log('Unbook request received', { day, date, time, bookings });
  
  // Find and remove the booking
  const initialLength = bookings.length;
  let filteredBookings;
  
  if (date) {
    // For one-time bookings, match by date and time (and not recurring)
    filteredBookings = bookings.filter(b => !(b.date === date && b.time === time && !b.is_recurring));
  } else {
    // For recurring bookings, match by day and time
    filteredBookings = bookings.filter(b => !(b.day === day && b.time === time && b.is_recurring));
  }
  
  console.log('Filtered bookings:', { initialLength, newLength: filteredBookings.length });
  
  if (filteredBookings.length === initialLength) {
    console.log('Unbook failed - booking not found', { day, date, time, bookings });
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  if (writeBookings(filteredBookings)) {
    res.json({ success: true, message: 'Slot unbooked successfully' });
  } else {
    res.status(500).json({ error: 'Failed to unbook slot' });
  }
});

// API: Clear all bookings (optional - for testing)
app.delete('/api/bookings', (req, res) => {
  if (writeBookings([])) {
    res.json({ success: true, message: 'All bookings cleared' });
  } else {
    res.status(500).json({ error: 'Failed to clear bookings' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
