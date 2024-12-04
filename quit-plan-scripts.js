// Define getAggressivenessLabel function
function getAggressivenessLabel(value) {
    switch (value) {
        case "1":
            return 'Aggressive';
        case "2":
            return 'Normal';
        case "3":
            return 'Conservative';
        default:
            return 'Normal';
    }
}

/**
 * Generates a personalized quit plan schedule based on user data.
 * @param {string} aggressivenessLevel - 'Aggressive', 'Normal', or 'Conservative'.
 * @param {number} awakeHours - Number of hours the user is awake per day (default is 16 hours).
 * @returns {object} An object containing the total duration, daily schedule, and time between Zyns.
 */
function generateQuitPlan(aggressivenessLevel, awakeHours = 16) {
  // Calculate baselineConsumption from average daily usage over the past 5 days
  const baselineConsumption = calculateAverageUsage(5);
// console.log("calculateAverageUsage(7): ", calculateAverageUsage(7));
    // const baselineConsumption = 10;

  // Aggressiveness factors
  const aggressivenessFactors = {
    Aggressive: 2,
    Normal: 3,
    Conservative: 4,
  };

  // Validate aggressiveness level
  if (!aggressivenessFactors.hasOwnProperty(aggressivenessLevel)) {
    throw new Error('Invalid aggressiveness level. Choose Aggressive, Normal, or Conservative.');
  }

  // Calculate Total Quit Duration (TQD)
  const F_aggressiveness = aggressivenessFactors[aggressivenessLevel];
  const TQD = Math.ceil(baselineConsumption * F_aggressiveness);

  // Determine Interval Duration (D)
  const D = Math.ceil(TQD / baselineConsumption);

  // Generate Daily Usage Schedule
  const dailySchedule = [];
  let N_t = baselineConsumption;

  for (let day = 1; day <= TQD; day++) {
    // Calculate N(t)
    N_t = baselineConsumption - Math.floor((day - 1) / D);
    if (N_t < 0) N_t = 0;

    // Calculate Time Between Zyns
    const awakeMinutes = awakeHours * 60;
    const timeBetweenZyns = N_t > 0 ? Math.round(awakeMinutes / N_t) : null;

    // Add to schedule
    dailySchedule.push({
      day: day,
      zynsPerDay: N_t,
      timeBetweenZyns: timeBetweenZyns,
    });
  }

  // Remove duplicate entries for consecutive days with the same Zyns per day
  const condensedSchedule = [];
  let previousZynsPerDay = null;
  let startDay = 1;

  for (let i = 0; i < dailySchedule.length; i++) {
    const current = dailySchedule[i];
    if (current.zynsPerDay !== previousZynsPerDay) {
      if (previousZynsPerDay !== null) {
        condensedSchedule.push({
          dayRange: startDay === current.day - 1 ? `${startDay}` : `${startDay}-${current.day - 1}`,
          zynsPerDay: previousZynsPerDay,
          timeBetweenZyns: dailySchedule[i - 1].timeBetweenZyns,
        });
      }
      startDay = current.day;
      previousZynsPerDay = current.zynsPerDay;
    }
  }

  // Add the last range
  condensedSchedule.push({
    dayRange: startDay === TQD ? `${startDay}` : `${startDay}-${TQD}`,
    zynsPerDay: previousZynsPerDay,
    timeBetweenZyns: dailySchedule[TQD - 1].timeBetweenZyns,
  });

  return {
    planType: aggressivenessLevel,
    totalDuration: TQD,
    dailySchedule: condensedSchedule,
  };
}

/**
 * Calculates the average daily usage over the past 'days' days.
 * @param {number} days - Number of past days to include in the calculation.
 * @returns {number} Average daily usage.
 */
function calculateAverageUsage(days) {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - days + 1);

  let totalUsage = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(pastDate);
    date.setDate(pastDate.getDate() + i);
    const formattedDate = getFormattedDate(date);

    const dailyUsage = usageData.filter(timestamp =>
      getFormattedDate(new Date(timestamp)) === formattedDate
    ).length;

    totalUsage += dailyUsage;
  }

  return totalUsage / days;
}

/**
 * Renders the quit plan calendar view showing the daily recommended Zyn usage and time between Zyns.
 */
function renderQuitPlanCalendar() {
  try {
    const calendarContainer = document.getElementById('quitPlanCalendar');
    if (!calendarContainer) return;

    // Clear existing content
    calendarContainer.innerHTML = '';

    // Calculate number of unique days with data
    let uniqueDates = new Set(usageData.map(timestamp => getFormattedDate(new Date(timestamp))));
    if (uniqueDates.size < 1) {
      // Less than 5 days of data, grey out the quit plan schedule

      // Display a message to the user
      const message = document.createElement('p');
      message.innerText = 'Not enough data to generate a quit plan. Please log your usage for at least 5 days.';
      calendarContainer.appendChild(message);

      // Add 'greyed-out' class to the container
      calendarContainer.classList.add('greyed-out');

      return;
    } else {
      // Remove 'greyed-out' class if present
      calendarContainer.classList.remove('greyed-out');
    }

    // Generate the quit plan using the stored settings
    let aggressivenessLevel = getAggressivenessLabel(localStorage.getItem('aggressivenessLevel') || '2');
    const quitPlan = generateQuitPlan(aggressivenessLevel);

    // Create a table to display the quit plan
    const table = document.createElement('table');
    table.classList.add('quit-plan-table');

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Day(s)', 'Zyns per Day', 'Time Between Zyns'].forEach(text => {
      const th = document.createElement('th');
      th.innerText = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    quitPlan.dailySchedule.forEach(entry => {
      const row = document.createElement('tr');
      const dayCell = document.createElement('td');
      dayCell.innerText = entry.dayRange;
      const zynsCell = document.createElement('td');
      zynsCell.innerText = entry.zynsPerDay;
      const timeCell = document.createElement('td');
      timeCell.innerText = entry.timeBetweenZyns ? `${entry.timeBetweenZyns} minutes` : 'N/A';

      row.appendChild(dayCell);
      row.appendChild(zynsCell);
      row.appendChild(timeCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Append the table to the calendar container
    calendarContainer.appendChild(table);
  } catch (error) {
    console.error('Error rendering quit plan calendar:', error);
  }
}

// Call renderQuitPlanCalendar when the page loads or quit plan settings change
document.addEventListener('DOMContentLoaded', renderQuitPlanCalendar);

// Optionally, export functions if needed elsewhere
// export { generateQuitPlan, renderQuitPlanCalendar };
