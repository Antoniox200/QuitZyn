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
 * @param {number} manualAvgConsumption - Optional manual average consumption to override calculated value.
 * @returns {object} An object containing the total duration, daily schedule, and time between Zyns.
 */
function generateQuitPlan(aggressivenessLevel, awakeHours = 16, manualAvgConsumption = null) {
// Use manual average consumption if provided and round it down to the nearest whole number
const baselineConsumption = manualAvgConsumption !== null
    ? Math.floor(manualAvgConsumption)
    : calculateAverageUsage(5);

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

  const quitPlan = {
    planType: aggressivenessLevel,
    totalDuration: TQD,
    dailySchedule: condensedSchedule,
  };
  // Save the quit plan to localStorage
  localStorage.setItem('quitPlan', JSON.stringify(quitPlan));
  return quitPlan;
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

    return Math.floor(totalUsage / days);
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

    // Check for saved quit plan in localStorage
    const savedPlan = localStorage.getItem('quitPlan');
    let quitPlan;
    if (savedPlan) {
      quitPlan = JSON.parse(savedPlan);
    } else {
      // Generate new quit plan and save it
      let aggressivenessLevel = getAggressivenessLabel(localStorage.getItem('aggressivenessLevel') || '2');
      quitPlan = generateQuitPlan(aggressivenessLevel);
    }

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

// Function to regenerate the quit plan, accepting an optional manual average consumption
function regenerateQuitPlan(manualAvgConsumption = null) {
  // Remove saved quit plan
  localStorage.removeItem('quitPlan');
  // Get aggressiveness level
  const aggressivenessLevel = getAggressivenessLabel(localStorage.getItem('aggressivenessLevel') || '2');
  // Generate new quit plan using manual average if provided
  generateQuitPlan(aggressivenessLevel, 16, manualAvgConsumption);
  // Render the updated quit plan
  renderQuitPlanCalendar();
}

// Expose regenerateQuitPlan to the global scope
window.regenerateQuitPlan = regenerateQuitPlan;

// Call renderQuitPlanCalendar when the page loads or quit plan settings change
document.addEventListener('DOMContentLoaded', renderQuitPlanCalendar);

// Optionally, export functions if needed elsewhere
// export { generateQuitPlan, renderQuitPlanCalendar };
