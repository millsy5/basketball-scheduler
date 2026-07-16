const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(bookings || []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    // Return empty array instead of error to prevent frontend crash
    res.json([]);
  }
});

// API: Unbook a single instance of a recurring booking
app.post('/api/unbook-instance', async (req, res) => {
  console.log('unbook-instance endpoint called');
  const { day, time, date, school, year } = req.body;
  
  if (!day || !time || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Find the recurring booking
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('day', day)
      .eq('time', time)
      .eq('is_recurring', true)
      .eq('school', school)
      .eq('year', year)
      .single();
    
    if (fetchError || !bookings) {
      console.log('Recurring booking not found', { day, time, date, school, year });
      return res.status(404).json({ error: 'Recurring booking not found' });
    }
    
    console.log('Unbook instance request', { day, time, date, school, year, booking: bookings });
    
    // Add the date to exceptions if not already there
    const exceptions = bookings.exceptions || [];
    if (!exceptions.includes(date)) {
      exceptions.push(date);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ exceptions })
        .eq('id', bookings.id);
      
      if (updateError) throw updateError;
    }
    
    res.json({ success: true, message: 'Instance unbooked successfully' });
  } catch (error) {
    console.error('Error unbooking instance:', error);
    res.status(500).json({ error: 'Failed to unbook instance' });
  }
});

// API: Book a slot
app.post('/api/book', async (req, res) => {
  const { day, date, time, name, is_recurring, gender, school, year } = req.body;
  
  if (!day || !time || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Calculate end time based on duration
    const timeSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
      '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
      '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
      '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'];
    const timeIndex = timeSlots.indexOf(time);
    
    // Duration is in minutes, convert to number of slots (30 minutes per slot)
    const durationInMinutes = duration || 60;
    const numberOfSlots = durationInMinutes / 30;
    
    const endTime = timeIndex !== -1 && timeIndex + numberOfSlots < timeSlots.length 
      ? timeSlots[timeIndex + numberOfSlots]
      : null;

    // Remove any existing booking for this day/time (overwrite)
    let deleteQuery;
    if (is_recurring) {
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('day', day)
        .eq('time', time)
        .eq('is_recurring', true)
        .eq('school', school)
        .eq('year', year);
    } else {
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('date', date)
        .eq('time', time)
        .eq('is_recurring', false)
        .eq('school', school)
        .eq('year', year);
    }
    
    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    // Add new booking with 1-hour duration
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        day,
        date: is_recurring ? null : (date || null),
        time,
        name,
        is_recurring: is_recurring || false,
        exceptions: [],
        gender: gender || 'Boys',
        school: school || 'Ballincollig Basketball Club',
        year: year || 2026,
        end_time: endTime,
        duration: 60,
        created_at: new Date().toISOString()
      });
    
    if (insertError) throw insertError;
    
    res.json({ success: true, message: 'Slot booked successfully' });
  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// API: Unbook a specific slot
app.post('/api/unbook', async (req, res) => {
  console.log('POST /api/unbook called');
  const { day, date, time, school, year } = req.body;
  
  console.log('Request body:', { day, date, time, school, year });
  
  if (!day || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let deleteQuery;
    if (date) {
      // For one-time bookings, match by date and time (and not recurring)
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('date', date)
        .eq('time', time)
        .eq('is_recurring', false)
        .eq('school', school)
        .eq('year', year);
    } else {
      // For recurring bookings, match by day and time
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('day', day)
        .eq('time', time)
        .eq('is_recurring', true)
        .eq('school', school)
        .eq('year', year);
    }
    
    const { error, count } = await deleteQuery;
    
    console.log('Unbook result:', { error, count });
    
    if (error) throw error;
    
    if (count === 0) {
      console.log('Unbook failed - booking not found', { day, date, time, school, year });
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ success: true, message: 'Slot unbooked successfully' });
  } catch (error) {
    console.error('Error unbooking slot:', error);
    res.status(500).json({ error: 'Failed to unbook slot' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase integration active');
});
