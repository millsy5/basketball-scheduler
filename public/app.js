// Configuration
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', 
  '9:00 PM', '10:00 PM', '11:00 PM'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let bookings = [];
let selectedSlot = null;
let currentYear = 2026;
let currentMonth = new Date().getMonth(); // Current month
let currentSchool = 'Ballincollig Basketball Club';
let pendingUnbook = null; // Track pending unbooking operation

// Select year
function selectYear(year) {
    currentYear = year;
    
    // Update button styles
    document.getElementById('year2026').className = year === 2026 
        ? 'text-xl font-bold text-white bg-red-600 px-4 py-2 rounded-lg' 
        : 'text-xl font-bold text-white bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600';
    document.getElementById('year2027').className = year === 2027 
        ? 'text-xl font-bold text-white bg-red-600 px-4 py-2 rounded-lg' 
        : 'text-xl font-bold text-white bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600';
    
    renderSchedule();
}

// Select school
function selectSchool(school) {
    currentSchool = school;
    
    // Update button styles
    const schools = ['Colaiste Choilm', 'Ballincollig Community School', 'Bishopstown Community School', 'Ballincollig Basketball Club'];
    schools.forEach(s => {
        const button = document.getElementById(`school-${s}`);
        if (button) {
            button.className = s === school 
                ? 'text-left px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-semibold'
                : 'text-left px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition';
        }
    });
    
    // Update title
    document.getElementById('clubTitle').textContent = school === 'Ballincollig Basketball Club' 
        ? '🏀 Ballincollig Basketball Club' 
        : `🏀 ${school}`;
    
    renderSchedule();
}

// Initialize the app
async function init() {
    await loadBookings();
    renderMonthNavigation();
    renderSchedule();
}

// Render month navigation sidebar
function renderMonthNavigation() {
    const navContainer = document.getElementById('monthNavigation');
    navContainer.innerHTML = '';

    months.forEach((month, index) => {
        const button = document.createElement('button');
        button.className = `w-full text-left px-4 py-2 rounded-lg transition ${
            index === currentMonth 
                ? 'bg-red-600 text-white font-semibold' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;
        button.textContent = month;
        button.onclick = () => {
            currentMonth = index;
            renderMonthNavigation();
            renderSchedule();
        };
        navContainer.appendChild(button);
    });
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

    // Create month header
    const monthHeader = document.createElement('h2');
    monthHeader.className = 'text-2xl font-bold text-red-600 mb-4 text-center';
    monthHeader.textContent = `${months[currentMonth]} ${currentYear}`;
    scheduleContainer.appendChild(monthHeader);

    // Get the weeks in the current month
    const weeksInMonth = getWeeksInMonth(currentYear, currentMonth);

    // Render each week as a horizontal grid
    weeksInMonth.forEach((week, weekIndex) => {
        const weekContainer = document.createElement('div');
        weekContainer.className = 'mb-6';

        const weekLabel = document.createElement('h3');
        weekLabel.className = 'text-lg font-semibold text-gray-700 mb-2';
        weekLabel.textContent = `Week ${weekIndex + 1}`;
        weekContainer.appendChild(weekLabel);

        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto';

        // Create table
        const table = document.createElement('table');
        table.className = 'w-full border-collapse';

        // Create header row with days and dates
        const headerRow = document.createElement('tr');
        headerRow.className = 'bg-gradient-to-r from-red-700 to-red-900 text-white';

        // Time column header
        const timeHeader = document.createElement('th');
        timeHeader.className = 'px-4 py-3 text-left font-bold sticky left-0 bg-red-800';
        timeHeader.textContent = 'Time';
        headerRow.appendChild(timeHeader);

        // Day headers with dates
        week.forEach(dayInfo => {
            const dayHeader = document.createElement('th');
            dayHeader.className = `px-4 py-3 text-center font-bold min-w-[100px] ${dayInfo.isCurrentMonth ? '' : 'bg-gray-400'}`;
            dayHeader.innerHTML = `${dayInfo.day}<br><span class="text-xs">${dayInfo.date}</span>`;
            headerRow.appendChild(dayHeader);
        });

        table.appendChild(headerRow);

        // Create rows for each time slot
        timeSlots.forEach(time => {
            const row = document.createElement('tr');
            row.className = timeSlots.indexOf(time) % 2 === 0 ? 'bg-gray-50' : 'bg-white';

            // Time cell
            const timeCell = document.createElement('td');
            timeCell.className = 'px-4 py-2 font-semibold text-gray-700 sticky left-0';
            timeCell.style.backgroundColor = timeSlots.indexOf(time) % 2 === 0 ? '#f9fafb' : '#ffffff';
            timeCell.textContent = time;
            row.appendChild(timeCell);

            // Day cells for this time
            week.forEach(dayInfo => {
                const booking = findBookingForDate(dayInfo.date, time);
                const slotCell = createSlotCellForDate(dayInfo.day, dayInfo.date, time, booking, dayInfo.isCurrentMonth);
                row.appendChild(slotCell);
            });

            table.appendChild(row);
        });

        tableContainer.appendChild(table);
        weekContainer.appendChild(tableContainer);
        scheduleContainer.appendChild(weekContainer);
    });
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
    console.log('createSlotCellForDate called', { day, date, time, booking, isCurrentMonth });
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
            console.log('Unbook button clicked', { day, date, time, isRecurring: booking.is_recurring });
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
            console.log('Book button clicked', { day, date, time });
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

    // Then, check for recurring bookings that match this day of week
    const dayOfWeek = new Date(date).getDay();
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // Our days array starts with Monday at index 0, so we need to adjust
    const dayIndex = (dayOfWeek + 6) % 7;
    const dayName = days[dayIndex];
    
    const recurringBooking = bookings.find(b => 
        b.is_recurring && 
        b.day === dayName && 
        b.time === time &&
        b.school === currentSchool &&
        b.year === currentYear
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

// Find a booking for a specific day and time (legacy, for compatibility)
function findBooking(day, time) {
    return bookings.find(b => b.day === day && b.time === time);
}

// Open the booking modal
function openBookingModal(day, date, time) {
    console.log('openBookingModal called', { day, date, time });
    selectedSlot = { day, date, time };
    document.getElementById('modalSlotInfo').textContent = `${day} (${date}) at ${time}`;
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
    console.log('openUnbookModal called', { day, date, time });
    pendingUnbook = { day, date, time };
    console.log('pendingUnbook set to', pendingUnbook);
    document.getElementById('unbookModalInfo').textContent = `${day} (${date}) at ${time}`;
    document.getElementById('unbookModal').classList.remove('hidden');
    document.getElementById('unbookModal').classList.add('flex');
}

// Close the unbooking modal
function closeUnbookModal() {
    console.log('closeUnbookModal called');
    document.getElementById('unbookModal').classList.add('hidden');
    document.getElementById('unbookModal').classList.remove('flex');
    pendingUnbook = null;
    console.log('pendingUnbook set to null');
}

// Handle unbook single instance choice
async function unbookSingleInstanceChoice() {
    console.log('unbookSingleInstanceChoice called', pendingUnbook);
    if (!pendingUnbook) return;
    
    // Save values before closing modal
    const { day, date, time } = pendingUnbook;
    closeUnbookModal();
    await unbookSingleInstance(day, date, time);
}

// Handle unbook recurring booking choice
async function unbookRecurringChoice() {
    console.log('unbookRecurringChoice called', pendingUnbook);
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

// Confirm the booking
async function confirmBooking() {
    const name = document.getElementById('playerName').value.trim();
    const bookingType = document.querySelector('input[name="bookingType"]:checked').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    console.log('confirmBooking called', { selectedSlot, name, bookingType, gender });
    
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
                time: selectedSlot.time,
                name: name,
                is_recurring: bookingType === 'recurring',
                gender: gender,
                school: currentSchool,
                year: currentYear
            })
        });

        console.log('Booking response status:', response.status);
        const data = await response.json();
        console.log('Booking response data:', data);

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
    console.log('unbookSlot called', { day, date, time, isRecurring });
    
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
    console.log('unbookRecurringBooking called', { day, time });

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

        console.log('unbookRecurringBooking response status:', response.status);
        const data = await response.json();
        console.log('unbookRecurringBooking response data:', data);

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
