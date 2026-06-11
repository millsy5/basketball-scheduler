# 🏀 Basketball Training Schedule

A simple web app for managing youth basketball club training sessions. Users can view weekly schedules and book available time slots.

## Features

- **Weekly Schedule**: Monday through Sunday with time slots (5 PM, 6 PM, 7 PM)
- **Easy Booking**: Click any free slot to book it with your name
- **Double-Booking Prevention**: Database ensures no slot can be booked twice
- **Mobile-Friendly**: Clean, responsive design that works on all devices
- **No Login Required**: Simple and accessible for everyone

## Tech Stack

- **Backend**: Node.js + Express
- **Storage**: JSON file (bookings.json) - Simple, no database setup needed
- **Frontend**: HTML + TailwindCSS (via CDN) + Vanilla JavaScript
- **Deployment**: Can be deployed for free on Vercel, Render, or Railway

## Setup Instructions

### Prerequisites
- Node.js installed on your computer (download from [nodejs.org](https://nodejs.org/))

### Installation

1. **Navigate to the project directory**
   ```bash
   cd "c:\Users\millss1\OneDrive - Dell Technologies\Devin projects\Basketball planner"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in your browser**
   - Go to: `http://localhost:3000`

## How It Works

### Backend (server.js)
- Uses Express to serve the frontend and handle API requests
- JSON file (`bookings.json`) stores bookings
- Three API endpoints:
  - `GET /api/bookings` - Get all current bookings
  - `POST /api/book` - Book a slot (prevents double booking)
  - `DELETE /api/bookings` - Clear all bookings (for testing)

### Frontend (public/)
- **index.html**: Main page with TailwindCSS styling
- **app.js**: JavaScript that:
  - Loads bookings from the API
  - Renders the weekly schedule grid
  - Handles clicking on free slots
  - Shows a modal to enter name
  - Sends booking requests to the server

### Storage Format
Bookings are stored in `bookings.json` as an array:
```json
[
  {
    "day": "Monday",
    "time": "5:00 PM",
    "name": "John",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
]
```

The server checks for duplicate bookings before adding new ones to prevent double booking.

## Deployment

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "Add New Project" and import your GitHub repo
4. Vercel will detect Node.js and deploy automatically
5. Your app will be live at `your-project.vercel.app`

**Note**: For Vercel, you may need to add a `vercel.json` file for serverless functions. The current setup works better on Render/Railway.

### Option 2: Render (Free)
1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Build command: `npm install`
6. Start command: `node server.js`
7. Deploy!

### Option 3: Railway (Free)
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and sign up
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway will auto-detect Node.js and deploy

## Customization

### Change Time Slots
Edit `timeSlots` array in `public/app.js`:
```javascript
const timeSlots = ['5:00 PM', '6:00 PM', '7:00 PM'];
```

### Change Days
Edit `days` array in `public/app.js`:
```javascript
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
```

### Clear All Bookings
Send a DELETE request to `/api/bookings` or add a button in the frontend.

## Troubleshooting

**Port already in use?**
- Change the PORT in `server.js` or set the `PORT` environment variable

**Bookings file not creating?**
- The app auto-creates `bookings.json` on first run. Make sure you have write permissions.

**Styling not loading?**
- Ensure you have an internet connection (TailwindCSS is loaded via CDN)

## License

Free to use for your basketball club!
