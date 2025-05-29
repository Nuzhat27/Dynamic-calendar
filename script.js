// Global Variables and DOM Element Selection
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYearDisplay = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

let loadedHolidaysData = null;

// Custom Tooltip Elements
let customTooltip = null;
let tooltipActive = false;

// Creates the custom tooltip element once
function createTooltipElement() {
    if (!customTooltip) {
        customTooltip = document.createElement('div');
        customTooltip.id = 'custom-tooltip';
        document.body.appendChild(customTooltip);
    }
}
createTooltipElement();

// Data Fetching
fetch('data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loadedHolidaysData = data;
        renderCalendar(currentMonth, currentYear);
    })
    .catch(error => {
        console.error("Failed to load calendar data:", error);
        currentMonthYearDisplay.textContent = "Error: Could not load calendar data.";
    });

// Calendar Rendering Function
function renderCalendar(month, year) {
    calendarGrid.innerHTML = '';

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    currentMonthYearDisplay.textContent = `${monthNames[month]} ${year}`;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach((name, index) => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.classList.add('day-name');
        if (index === 0) dayNameDiv.classList.add('sun');
        if (index === 6) dayNameDiv.classList.add('sat');
        dayNameDiv.textContent = name;
        calendarGrid.appendChild(dayNameDiv);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = day;

        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        // Apply base colors for Sundays and Saturdays
        if (dayOfWeek === 0) { dayDiv.classList.add('sun'); }
        else if (dayOfWeek === 6) { dayDiv.classList.add('sat'); }

        // Highlight current day
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('current-day');
        }

        // Find the specific holiday for the current day
        let currentDayHoliday = null;
        if (loadedHolidaysData && loadedHolidaysData.nalco_holidays) {
            currentDayHoliday = loadedHolidaysData.nalco_holidays.find(holiday => {
                // Robust Date Parsing (DD-MM-YYYY)
                const dateParts = holiday.holiday_date.split(' ')[0].split('-');
                const hDay = parseInt(dateParts[0], 10);
                const hMonth = parseInt(dateParts[1], 10) - 1;
                const hYear = parseInt(dateParts[2], 10);

                return hDay === day && hMonth === month && hYear === year;
            });
        }

        // Apply highlighting and tooltip based on the found holiday
        if (currentDayHoliday) {
            // Apply distinct highlight classes for PH and RH
            if (currentDayHoliday.type === 'PH') {
                dayDiv.classList.add('public-holiday');
            } else if (currentDayHoliday.type === 'RH') {
                dayDiv.classList.add('restricted-holiday');
            }
            // WO holidays get no highlight class

            // Custom Tooltip Event Listeners (only for non-WO holidays)
            if (currentDayHoliday.type !== 'WO') {
                dayDiv.dataset.tooltip = currentDayHoliday.Title;

                dayDiv.addEventListener('mouseover', function(event) {
                    const rect = event.target.getBoundingClientRect();
                    const scrollX = window.scrollX || window.pageXOffset;
                    const scrollY = window.scrollY || window.pageYOffset;

                    customTooltip.textContent = event.target.dataset.tooltip;
                    customTooltip.style.left = `${rect.left + scrollX + rect.width / 2}px`;
                    customTooltip.style.top = `${rect.top + scrollY - customTooltip.offsetHeight - 10}px`;
                    
                    customTooltip.style.opacity = '1';
                    customTooltip.style.visibility = 'visible';
                    tooltipActive = true;
                });

                dayDiv.addEventListener('mouseout', function() {
                    customTooltip.style.opacity = '0';
                    customTooltip.style.visibility = 'hidden';
                    tooltipActive = false;
                });

                dayDiv.addEventListener('mousemove', function() {
                    // This helps hide tooltip if mouse quickly moves off and on without a proper out event
                    if (!tooltipActive && customTooltip.style.visibility === 'visible') {
                        customTooltip.style.opacity = '0';
                        customTooltip.style.visibility = 'hidden';
                    }
                });
            }
        }

        calendarGrid.appendChild(dayDiv);
    }
}

// Event Listeners for Month Navigation
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
    // Hide tooltip when changing month
    if (customTooltip) {
        customTooltip.style.opacity = '0';
        customTooltip.style.visibility = 'hidden';
        tooltipActive = false;
    }
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
    // Hide tooltip when changing month
    if (customTooltip) {
        customTooltip.style.opacity = '0';
        customTooltip.style.visibility = 'hidden';
        tooltipActive = false;
    }
});