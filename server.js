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
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// API: Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// API: Unbook a single instance of a recurring booking
app.post('/api/unbook-instance', async (req, res) => {
  console.log('unbook-instance endpoint called');
  const { day, time, date } = req.body;
  
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
      .single();
    
    if (fetchError || !bookings) {
      console.log('Recurring booking not found', { day, time, date });
      return res.status(404).json({ error: 'Recurring booking not found' });
    }
    
    console.log('Unbook instance request', { day, time, date, booking: bookings });
    
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
  const { day, date, time, name, is_recurring } = req.body;
  
  if (!day || !time || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Remove any existing booking for this day/time (overwrite)
    let deleteQuery;
    if (is_recurring) {
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('day', day)
        .eq('time', time)
        .eq('is_recurring', true);
    } else {
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('date', date)
        .eq('time', time)
        .eq('is_recurring', false);
    }
    
    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    // Add new booking
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        day,
        date: is_recurring ? null : (date || null),
        time,
        name,
        is_recurring: is_recurring || false,
        exceptions: [],
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
  const { day, date, time } = req.body;
  
  console.log('Request body:', { day, date, time });
  
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
        .eq('is_recurring', false);
    } else {
      // For recurring bookings, match by day and time
      deleteQuery = supabase
        .from('bookings')
        .delete()
        .eq('day', day)
        .eq('time', time)
        .eq('is_recurring', true);
    }
    
    const { error, count } = await deleteQuery;
    
    console.log('Unbook result:', { error, count });
    
    if (error) throw error;
    
    if (count === 0) {
      console.log('Unbook failed - booking not found', { day, date, time });
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ success: true, message: 'Slot unbooked successfully' });
  } catch (error) {
    console.error('Error unbooking slot:', error);
    res.status(500).json({ error: 'Failed to unbook slot' });
  }
});

// API: Clear all bookings (optional - for testing)
app.delete('/api/bookings', async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (error) throw error;
    res.json({ success: true, message: 'All bookings cleared' });
  } catch (error) {
    console.error('Error clearing bookings:', error);
    res.status(500).json({ error: 'Failed to clear bookings' });
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
