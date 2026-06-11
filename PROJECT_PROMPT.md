# Basketball Training Schedule Web App - Project Prompt

## Project Overview
A youth basketball training schedule web application with a horizontal grid layout (days as columns, times 9am-11pm as rows). The app supports both recurring and one-time bookings, with the ability to unbook individual instances of recurring bookings or remove entire recurring bookings.

## Tech Stack
- **Frontend**: Vanilla JavaScript, TailwindCSS
- **Backend**: Node.js with Express
- **Storage**: JSON file (bookings.json)
- **Server**: Runs on http://localhost:3000

## Key Features
1. **Horizontal Grid Layout**: Days displayed as columns (Monday-Sunday), times as rows (9am-11pm)
2. **Month Navigation**: Sidebar with month buttons to navigate between months
3. **Booking Types**: 
   - One-time bookings (specific date)
   - Recurring bookings (weekly, same day/time)
4. **Unbooking Options**:
   - Unbook single instance of recurring booking (adds date to exceptions array)
   - Remove entire recurring booking
   - Cancel (do nothing)
5. **Visual Styling**:
   - Red and black color scheme
   - Previous/next month dates shown in grey
   - Booked slots display name and unbook button
   - Free slots display book button

## Architecture

### Frontend Structure
- `public/index.html` - Main HTML structure
- `public/app.js` - Frontend JavaScript logic
- `public/BBC logo.jpeg` - Logo image

### Backend Structure
- `server.js` - Express server with API endpoints
- `bookings.json` - JSON file storage for bookings
- `package.json` - Node.js dependencies

## Data Model

### Booking Object
```json
{
  "day": "Monday",              // Day of week for recurring bookings
  "date": "2026-06-01",         // Date for one-time bookings (null for recurring)
  "time": "5:00 PM",           // Time slot
  "name": "U11",               // Player/team name
  "is_recurring": true,        // Boolean flag
  "exceptions": [],            // Array of dates excluded from recurring booking
  "created_at": "2026-06-11T10:00:00.000Z"
}
```

## API Endpoints

### GET /api/bookings
- Returns all bookings from bookings.json

### POST /api/book
- Creates a new booking
- **Request body**: `{ day, date, time, name, is_recurring }`
- **Behavior**: Overwrites any existing booking for the same day/time
- **Response**: `{ success: true, message: "Slot booked successfully" }`

### POST /api/unbook
- Removes an entire booking (one-time or recurring)
- **Request body**: `{ day, date?, time }`
  - For recurring: `{ day, time }` (no date)
  - For one-time: `{ day, date, time }`
- **Response**: `{ success: true, message: "Slot unbooked successfully" }`

### POST /api/unbook-instance
- Unbooks a single instance of a recurring booking
- **Request body**: `{ day, time, date }`
- **Behavior**: Adds the date to the recurring booking's exceptions array
- **Response**: `{ success: true, message: "Instance unbooked successfully" }`

## Important Implementation Details

### Day-of-Week Calculation
- JavaScript `getDay()` returns 0 for Sunday, 1 for Monday, etc.
- App uses Monday-first indexing: `['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']`
- Conversion formula: `(getDay() + 6) % 7` converts Sunday=0 to Monday=0 indexing

### Timezone Handling
- **Critical**: Use local date strings instead of `toISOString()` to avoid timezone issues
- Correct approach:
  ```javascript
  const dateYear = currentDay.getFullYear();
  const dateMonth = String(currentDay.getMonth() + 1).padStart(2, '0');
  const dateDay = String(currentDay.getDate()).padStart(2, '0');
  const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;
  ```
- Wrong approach: `currentDay.toISOString().split('T')[0]` (converts to UTC, causes day shifts)

### Week Layout
- Week starts on Monday, ends on Sunday
- Start calculation: `currentDay.setDate(currentDay.getDate() - (currentDay.getDay() + 6) % 7)`
- End condition: `currentDay.getDay() !== 1` (Monday)

### Booking Overwrite Logic
- When creating a new booking, the server removes any existing booking for the same day/time
- This allows users to overwrite existing bookings, including those with exceptions

### Unbooking Modal
- Custom modal with three options for recurring bookings:
  1. Unbook this instance only
  2. Remove entire recurring booking
  3. Cancel (do nothing)
- Functions must be globally accessible: `window.functionName = functionName`
- Values must be saved before closing modal to avoid null reference errors

### Styling Previous/Next Month Dates
- Use `isCurrentMonth` flag to grey out dates from previous/next months
- Remove book/unbook buttons for non-current month dates
- Show dash for free slots in previous/next months

## File Structure
```
Basketball planner/
├── server.js
├── package.json
├── bookings.json
└── public/
    ├── index.html
    ├── app.js
    └── BBC logo.jpeg
```

## Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5"
}
```

## Running the Project
1. Install dependencies: `npm install`
2. Start server: `npm start` or `node server.js`
3. Open browser: `http://localhost:3000`

## Key Lessons Learned

### Common Pitfalls
1. **Timezone bugs**: Always use local date strings, never `toISOString()` for date display
2. **Day-of-week mismatches**: Ensure consistent conversion between JavaScript `getDay()` and app's day array
3. **Variable shadowing**: Don't redeclare function parameters (e.g., `year`, `month`) inside loops
4. **Modal event listeners**: Make functions globally accessible for HTML onclick handlers, or use addEventListener
5. **Async/await order**: Save values from objects before calling functions that nullify them

### Debugging Tips
1. Add console logs at key points to trace request flow
2. Check browser console for JavaScript errors
3. Verify server logs for API request/response details
4. Test with both one-time and recurring bookings
5. Verify day/date calculations match expected values

## Future Enhancement Ideas
1. Add user authentication
2. Add database (SQLite, PostgreSQL) instead of JSON file
3. Add email notifications for bookings
4. Add calendar export (ICS format)
5. Add admin panel for managing bookings
6. Add booking conflicts prevention
7. Add time slot availability limits
8. Add mobile-responsive design improvements
