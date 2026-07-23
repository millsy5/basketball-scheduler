// Configuration
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
  '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let bookings = [];
let selectedSlot = null;
let currentYear = new Date().getFullYear(); // Current year
let currentMonth = new Date().getMonth(); // Current month
let currentSchool = 'Colaiste Choilm';
let selectedDay = null; // Track selected day for detail view
let isAuthenticated = false; // Track authentication state

// Navigate to previous month
function previousMonth() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        calendarGrid.style.opacity = '0';
        calendarGrid.style.transform = 'translateX(20px)';
    }
    
    setTimeout(() => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateMonthYearDisplay();
        renderSchedule();
        
        setTimeout(() => {
            const newGrid = document.getElementById('calendarGrid');
            if (newGrid) {
                newGrid.style.opacity = '1';
                newGrid.style.transform = 'translateX(0)';
            }
        }, 50);
    }, 150);
}

// Navigate to next month
function nextMonth() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        calendarGrid.style.opacity = '0';
        calendarGrid.style.transform = 'translateX(-20px)';
    }
    
    setTimeout(() => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateMonthYearDisplay();
        renderSchedule();
        
        setTimeout(() => {
            const newGrid = document.getElementById('calendarGrid');
            if (newGrid) {
                newGrid.style.opacity = '1';
                newGrid.style.transform = 'translateX(0)';
            }
        }, 50);
    }, 150);
}

// Update month/year display
function updateMonthYearDisplay() {
    const display = document.getElementById('currentMonthYear');
    if (display) {
        display.textContent = `${months[currentMonth]} ${currentYear}`;
    }
}

// Select school
function selectSchool(school) {
    currentSchool = school;
    
    // Update dropdown selection
    const schoolDropdown = document.getElementById('schoolDropdown');
    if (schoolDropdown) {
        schoolDropdown.value = school;
    }
    
    renderSchedule();
}


// Initialize the app
async function init() {
    // Check authentication on page load
    checkAuthentication();
    
    if (!isAuthenticated) {
        return; // Don't load data if not authenticated
    }
    
    await loadBookings();
    updateMonthYearDisplay();
    
    // Set dropdown to match currentSchool
    const schoolDropdown = document.getElementById('schoolDropdown');
    if (schoolDropdown) {
        schoolDropdown.value = currentSchool;
    }
    
    renderSchedule();
}

// Check authentication state
function checkAuthentication() {
    const auth = localStorage.getItem('auth');
    if (auth === 'admin') {
        isAuthenticated = true;
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    } else {
        isAuthenticated = false;
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }
}

// Login function
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (username === 'admin' && password === 'admin1') {
        isAuthenticated = true;
        localStorage.setItem('auth', 'admin');
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        
        // Load data after successful login
        await loadBookings();
        updateMonthYearDisplay();
        
        // Set dropdown to match currentSchool
        const schoolDropdown = document.getElementById('schoolDropdown');
        if (schoolDropdown) {
            schoolDropdown.value = currentSchool;
        }
        
        renderSchedule();
    } else {
        showToast('Invalid username or password', 'error');
    }
}

// Logout function
function logout() {
    isAuthenticated = false;
    localStorage.removeItem('auth');
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    
    // Clear form fields
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}


// Load bookings from the server
async function loadBookings() {
    try {
        const response = await fetch('/api/bookings');
        bookings = await response.json();
    } catch (error) {
        console.error('Error loading bookings:', error);
        showToast('Error loading bookings', 'error');
    }
}

// Render the schedule grid
function renderSchedule() {
    const scheduleContainer = document.getElementById('schedule');
    scheduleContainer.innerHTML = '';

    // Get the weeks in the current month
    const weeksInMonth = getWeeksInMonth(currentYear, currentMonth);

    // Render monthly view
    renderMonthlyView(scheduleContainer, weeksInMonth);
}

// Render monthly view (calendar grid)
function renderMonthlyView(scheduleContainer, weeksInMonth) {
    // Create calendar grid
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'bg-white rounded-xl shadow-md p-4';
    calendarGrid.id = 'calendarGrid';
    calendarGrid.style.width = '100%';
    calendarGrid.style.maxWidth = '100%';
    
    // Add transition for month changes
    calendarGrid.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    
    // Add touch event listeners for swipe navigation
    let touchStartX = 0;
    let touchEndX = 0;
    
    calendarGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    calendarGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next month
                nextMonth();
            } else {
                // Swipe right - previous month
                previousMonth();
            }
        }
    }

    // Create day headers
    const dayHeaders = document.createElement('div');
    dayHeaders.className = 'grid grid-cols-7 gap-1 mb-2 w-full';
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'text-center font-bold text-gray-700 py-2 text-xs';
        dayHeader.textContent = day.substring(0, 3);
        dayHeaders.appendChild(dayHeader);
    });
    calendarGrid.appendChild(dayHeaders);

    // Create calendar cells
    const calendarCells = document.createElement('div');
    calendarCells.className = 'grid grid-cols-7 gap-1 w-full';

    // Get all dates in the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 for Monday, etc.

    // Add empty cells for days before the first day of the month
    // Adjust so Monday is 0, Sunday is 6
    const adjustedStartDay = (startDayOfWeek + 6) % 7;
    for (let i = 0; i < adjustedStartDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'bg-gray-100 rounded-lg min-h-[80px]';
        calendarCells.appendChild(emptyCell);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
        const dayName = days[(dayOfWeek + 6) % 7];

        const cell = document.createElement('div');
        cell.className = 'border border-gray-200 rounded-lg p-1 min-h-[80px] bg-white hover:bg-gray-50 cursor-pointer';
        cell.onclick = () => openDayDetailModal(dayName, dateString, day);

        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'font-bold text-gray-700 mb-1';
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        // Get bookings for this day (including recurring bookings)
        const dayBookings = [];
        
        // Check one-time bookings
        bookings.filter(b => 
            b.date === dateString && 
            b.school === currentSchool && 
            b.year === currentYear
        ).forEach(b => dayBookings.push(b));
        
        // Check recurring bookings (don't filter by year for recurring - they persist across years)
        bookings.filter(b => 
            b.is_recurring && 
            b.day === dayName && 
            b.school === currentSchool &&
            (!b.exceptions || !b.exceptions.includes(dateString))
        ).forEach(b => dayBookings.push(b));

        // Bookings container with scrollbar
        const bookingsContainer = document.createElement('div');
        bookingsContainer.className = 'space-y-1 max-h-[60px] overflow-y-auto';
        
        dayBookings.forEach(booking => {
            const bookingEl = document.createElement('div');
            const bgColor = booking.gender === 'Girls' ? 'bg-pink-100' : 'bg-blue-100';
            bookingEl.className = `text-xs p-1 rounded ${bgColor} truncate`;
            bookingEl.textContent = booking.name;
            bookingsContainer.appendChild(bookingEl);
        });

        cell.appendChild(bookingsContainer);
        calendarCells.appendChild(cell);
    }

    calendarGrid.appendChild(calendarCells);
    scheduleContainer.appendChild(calendarGrid);
}

// Get weeks in a month as arrays of day objects
function getWeeksInMonth(year, month) {
    const weeks = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    let currentDay = new Date(firstDayOfMonth);
    // Start from Monday of the first week
    currentDay.setDate(currentDay.getDate() - (currentDay.getDay() + 6) % 7);
    
    while (currentDay <= lastDayOfMonth || weeks.length === 0 || currentDay.getDay() !== 1) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            // Use local date string instead of ISO string to avoid timezone issues
            const dateYear = currentDay.getFullYear();
            const dateMonth = String(currentDay.getMonth() + 1).padStart(2, '0');
            const dateDay = String(currentDay.getDate()).padStart(2, '0');
            const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;
            
            // getDay() returns 0 for Sunday, 1 for Monday, etc.
            // Our days array starts with Monday at index 0, so we need to adjust
            const dayOfWeek = currentDay.getDay();
            const dayIndex = (dayOfWeek + 6) % 7; // Convert Sunday=0 to Saturday=6 to Monday=0
            const dayName = days[dayIndex];
            week.push({
                day: dayName,
                date: dateStr,
                isCurrentMonth: currentDay.getMonth() === month
            });
            currentDay.setDate(currentDay.getDate() + 1);
        }
        // Only add week if it has days from the current month
        if (week.some(d => d.isCurrentMonth)) {
            weeks.push(week);
        }
        if (currentDay.getMonth() !== month && weeks.length > 0) {
            break;
        }
    }
    
    return weeks;
}

// Create a slot cell for the table (with date support)
function createSlotCellForDate(day, date, time, booking, isCurrentMonth) {
    const cell = document.createElement('td');
    
    // Grey out cells for previous/next month dates
    if (!isCurrentMonth) {
        cell.className = 'px-2 py-2 border border-gray-200 text-center bg-gray-100 text-gray-400';
        
        if (booking) {
            // Booked slot in previous/next month
            cell.innerHTML = `
                <div class="text-xs font-semibold text-gray-400 truncate">${booking.name}${booking.is_recurring ? ' ♻️' : ''}</div>
            `;
        } else {
            // Free slot in previous/next month
            cell.innerHTML = `<span class="text-xs text-gray-400">-</span>`;
        }
        return cell;
    }
    
    cell.className = 'px-2 py-2 border border-gray-200 text-center';

    if (booking) {
        // Booked slot in current month
        const bgColor = booking.gender === 'Girls' ? 'bg-pink-100' : 'bg-blue-100';
        cell.className = `px-2 py-2 border border-gray-200 text-center ${bgColor}`;
        
        // Show booking with unbook button (merged cells handled by rowspan in renderSchedule)
        cell.innerHTML = `
            <div class="text-xs font-semibold text-gray-800 truncate">${booking.name}${booking.is_recurring ? ' ♻️' : ''}</div>
            <button 
                class="mt-1 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition"
                title="Unbook this slot"
                data-day="${day}"
                data-date="${date}"
                data-time="${time}"
                data-is-recurring="${booking.is_recurring}"
            >
                Unbook
            </button>
        `;
        const button = cell.querySelector('button');
        button.addEventListener('click', () => {
            unbookSlot(day, date, time, booking.is_recurring);
        });
    } else {
        // Free slot in current month
        cell.className = 'px-2 py-2 border border-gray-200 text-center cursor-pointer hover:bg-red-50 transition';
        cell.innerHTML = `
            <button 
                class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition w-full"
                data-day="${day}"
                data-date="${date}"
                data-time="${time}"
            >
                Book
            </button>
        `;
        const button = cell.querySelector('button');
        button.addEventListener('click', () => {
            openBookingModal(day, date, time);
        });
    }

    return cell;
}

// Find a booking for a specific date and time (checks exceptions for recurring bookings)
function findBookingForDate(date, time) {
    // First, check for a one-time booking on this specific date
    const oneTimeBooking = bookings.find(b => 
        !b.is_recurring && 
        b.date === date && 
        b.time === time &&
        b.school === currentSchool &&
        b.year === currentYear
    );
    if (oneTimeBooking) {
        return oneTimeBooking;
    }

    // Then, check for recurring bookings that match this day of week (don't filter by year - persist across years)
    const dayOfWeek = new Date(date).getDay();
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // Our days array starts with Monday at index 0, so we need to adjust
    const dayIndex = (dayOfWeek + 6) % 7;
    const dayName = days[dayIndex];
    
    const recurringBooking = bookings.find(b => 
        b.is_recurring && 
        b.day === dayName && 
        b.time === time &&
        b.school === currentSchool
    );
    
    if (recurringBooking) {
        // Check if this specific date is in the exceptions
        if (recurringBooking.exceptions && recurringBooking.exceptions.includes(date)) {
            return null; // This instance is unbooked
        }
        return recurringBooking;
    }

    return null;
}

// Open the booking modal
function openBookingModal(day, date, time) {
    selectedSlot = { day, date, time };
    
    // Check if this is from monthly view (time is '9:00 AM' default)
    const isMonthlyView = time === '9:00 AM' && viewMode === 'monthly';
    
    if (isMonthlyView) {
        // Show time and duration dropdowns for monthly view
        document.getElementById('timeSelection').classList.remove('hidden');
        document.getElementById('durationSelection').classList.remove('hidden');
        document.getElementById('modalSlotInfo').textContent = `${day} (${date})`;
        
        // Populate time dropdown with available times
        const timeDropdown = document.getElementById('timeDropdown');
        timeDropdown.innerHTML = '';
        
        timeSlots.forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.textContent = t;
            
            // Check if this time slot is already booked
            const booking = findBookingForDate(date, t);
            if (booking) {
                option.disabled = true;
                option.textContent += ' (booked)';
            }
            
            timeDropdown.appendChild(option);
        });
    } else {
        // Hide time dropdown for weekly view (time is already selected)
        document.getElementById('timeSelection').classList.add('hidden');
        // Show duration dropdown for weekly view
        document.getElementById('durationSelection').classList.remove('hidden');
        document.getElementById('modalSlotInfo').textContent = `${day} (${date}) at ${time}`;
    }
    
    document.getElementById('playerName').value = '';
    document.getElementById('bookingModal').classList.remove('hidden');
    document.getElementById('bookingModal').classList.add('flex');
    document.getElementById('playerName').focus();
}

// Close the modal
function closeModal() {
    document.getElementById('bookingModal').classList.add('hidden');
    document.getElementById('bookingModal').classList.remove('flex');
    selectedSlot = null;
}

// Open the unbooking options modal
function openUnbookModal(day, date, time) {
    pendingUnbook = { day, date, time };
    document.getElementById('unbookModalInfo').textContent = `${day} (${date}) at ${time}`;
    document.getElementById('unbookModal').classList.remove('hidden');
    document.getElementById('unbookModal').classList.add('flex');
}

// Close the unbooking modal
function closeUnbookModal() {
    document.getElementById('unbookModal').classList.add('hidden');
    document.getElementById('unbookModal').classList.remove('flex');
    pendingUnbook = null;
}

// Handle unbook single instance choice
async function unbookSingleInstanceChoice() {
    if (!pendingUnbook) return;
    
    // Save values before closing modal
    const { day, date, time } = pendingUnbook;
    closeUnbookModal();
    await unbookSingleInstance(day, date, time);
}

// Handle unbook recurring booking choice
async function unbookRecurringChoice() {
    if (!pendingUnbook) return;
    
    // Save values before closing modal
    const { day, time } = pendingUnbook;
    closeUnbookModal();
    await unbookRecurringBooking(day, time);
}

// Make functions globally accessible for HTML onclick handlers
window.unbookSingleInstanceChoice = unbookSingleInstanceChoice;
window.unbookRecurringChoice = unbookRecurringChoice;
window.closeUnbookModal = closeUnbookModal;
window.login = login;
window.logout = logout;

// Confirm the booking
async function confirmBooking() {
    const name = document.getElementById('playerName').value.trim();
    const bookingType = document.querySelector('input[name="bookingType"]:checked').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    // Check if this is monthly view booking (time dropdown is visible)
    const isMonthlyView = !document.getElementById('timeSelection').classList.contains('hidden');
    
    let time = selectedSlot.time;
    let duration = 60; // Default 1 hour
    
    if (isMonthlyView) {
        time = document.getElementById('timeDropdown').value;
    }
    
    // Get duration from dropdown (available in both views)
    duration = parseInt(document.getElementById('durationDropdown').value);
    
    if (!name) {
        showToast('Please enter your name', 'error');
        return;
    }

    if (!selectedSlot) {
        showToast('No slot selected', 'error');
        return;
    }

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                day: selectedSlot.day,
                date: selectedSlot.date,
                time: time,
                name: name,
                is_recurring: bookingType === 'recurring',
                gender: gender,
                school: currentSchool,
                year: currentYear,
                duration: duration
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Booking confirmed! 🏀', 'success');
            closeModal();
            await loadBookings();
            renderSchedule();
        } else {
            showToast(data.error || 'Booking failed', 'error');
        }
    } catch (error) {
        console.error('Error booking slot:', error);
        showToast('Error booking slot', 'error');
    }
}

// Unbook a slot
async function unbookSlot(day, date, time, isRecurring) {
    if (isRecurring) {
        // For recurring bookings, show the custom unbooking options modal
        openUnbookModal(day, date, time);
    } else {
        // For one-time bookings, just use a simple confirm dialog
        if (!confirm(`Are you sure you want to unbook ${day} (${date}) at ${time}?`)) {
            return;
        }
        await unbookOneTimeBooking(day, date, time);
    }
}

// Unbook a single instance of a recurring booking
async function unbookSingleInstance(day, date, time) {
    try {
        const response = await fetch('/api/unbook-instance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                day: day,
                time: time,
                date: date,
                school: currentSchool,
                year: currentYear
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Single instance unbooked successfully', 'success');
            await loadBookings();
            renderSchedule();
        } else {
            showToast(data.error || 'Unbooking failed', 'error');
        }
    } catch (error) {
        console.error('Error unbooking instance:', error);
        showToast('Error unbooking instance', 'error');
    }
}

// Remove entire recurring booking
async function unbookRecurringBooking(day, time) {
    try {
        const response = await fetch('/api/unbook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                day: day,
                time: time,
                school: currentSchool,
                year: currentYear
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Recurring booking removed successfully', 'success');
            await loadBookings();
            renderSchedule();
        } else {
            showToast(data.error || 'Unbooking failed', 'error');
        }
    } catch (error) {
        console.error('Error unbooking recurring booking:', error);
        showToast('Error unbooking recurring booking', 'error');
    }
}

// Open day detail modal
function openDayDetailModal(dayName, dateString, day) {
    selectedDay = { dayName, dateString, day };
    
    // Set modal title
    const title = document.getElementById('dayDetailTitle');
    title.textContent = `${dayName} ${dateString}`;
    
    // Get bookings for this day
    const dayBookings = [];
    
    // Check one-time bookings
    bookings.filter(b => 
        b.date === dateString && 
        b.school === currentSchool && 
        b.year === currentYear
    ).forEach(b => dayBookings.push(b));
    
    // Check recurring bookings
    bookings.filter(b => 
        b.is_recurring && 
        b.day === dayName && 
        b.school === currentSchool &&
        (!b.exceptions || !b.exceptions.includes(dateString))
    ).forEach(b => dayBookings.push(b));
    
    // Populate bookings list
    const bookingsList = document.getElementById('dayBookingsList');
    bookingsList.innerHTML = '';
    
    if (dayBookings.length === 0) {
        bookingsList.innerHTML = '<p class="text-gray-500 text-center">No bookings for this day</p>';
    } else {
        dayBookings.forEach(booking => {
            const bookingEl = document.createElement('div');
            const bgColor = booking.gender === 'Girls' ? 'bg-pink-100' : 'bg-blue-100';
            bookingEl.className = `p-3 rounded ${bgColor} flex justify-between items-center`;
            bookingEl.innerHTML = `
                <div>
                    <div class="font-semibold text-sm">${booking.time}</div>
                    <div class="text-sm">${booking.name}</div>
                    <div class="text-xs text-gray-600">${booking.gender} • ${booking.duration} min</div>
                </div>
                <button onclick="unbookSlot('${booking.day}', '${booking.date}', '${booking.time}', ${booking.is_recurring})" class="text-red-600 hover:text-red-800 text-sm">Unbook</button>
            `;
            bookingsList.appendChild(bookingEl);
        });
    }
    
    // Show modal
    document.getElementById('dayDetailModal').classList.remove('hidden');
    document.getElementById('dayDetailModal').classList.add('flex');
}

// Close day detail modal
function closeDayDetailModal() {
    document.getElementById('dayDetailModal').classList.add('hidden');
    document.getElementById('dayDetailModal').classList.remove('flex');
    selectedDay = null;
}

// Open booking modal from day detail
function openBookingModalFromDayDetail() {
    if (selectedDay) {
        closeDayDetailModal();
        openBookingModal(selectedDay.dayName, selectedDay.dateString, '9:00 AM');
    }
}

// Make functions globally accessible for HTML onclick handlers
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.openDayDetailModal = openDayDetailModal;
window.closeDayDetailModal = closeDayDetailModal;
window.openBookingModalFromDayDetail = openBookingModalFromDayDetail;
window.openBookingModal = openBookingModal;
window.closeModal = closeModal;
window.confirmBooking = confirmBooking;
window.unbookSlot = unbookSlot;
window.selectSchool = selectSchool;
window.openUnbookModal = openUnbookModal;
window.closeUnbookModal = closeUnbookModal;
window.unbookSingleInstanceChoice = unbookSingleInstanceChoice;
window.unbookRecurringChoice = unbookRecurringChoice;

// Unbook a one-time booking
async function unbookOneTimeBooking(day, date, time) {
    try {
        const response = await fetch('/api/unbook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                day: day,
                date: date,
                time: time,
                school: currentSchool,
                year: currentYear
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Slot unbooked successfully', 'success');
            await loadBookings();
            renderSchedule();
        } else {
            showToast(data.error || 'Unbooking failed', 'error');
        }
    } catch (error) {
        console.error('Error unbooking slot:', error);
        showToast('Error unbooking slot', 'error');
    }
}

// Show a toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition';
    } else {
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Handle Enter key in the name input
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBooking();
        }
    });
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeUnbookModal();
    }
});

// Initialize the app when the page loads
init();
