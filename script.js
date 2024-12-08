// Initialize variables
let usageData = [];
let totalCans = 0;
let chart;
let currentChartType = 'line'; // Default chart type
let pricePerCan = 5.99; // Default price per can including NYC sales tax
let nicotineStrength = 3; // Default nicotine strength in mg

// Variables for the hourly breakdown chart
let selectedDate = getDateWithoutTime(new Date()); // Default to today
let earliestDateWithData;
let latestDateWithData;
let hourlyChart; // Define the hourlyChart variable

// Variable for time format
let timeFormat = '24'; // Default to 24-hour

// Variable to store the state of showing averages
let showHourlyAverages = true;

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    updateStats();
    renderChart();
    updateHourlyChart();
    updateDateNavigation();
    renderQuitPlanCalendar(); // Call the function to render the quit plan calendar
});

// Utility function to strip time components from a date
function getDateWithoutTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Event listeners for buttons
document.getElementById('incrementButton').addEventListener('click', function () {
    logUsage(1);
});

document.getElementById('addButton').addEventListener('click', function () {
    let increment = parseInt(document.getElementById('zynIncrement').value);
    const MAX_INCREMENT = 100; // Set a reasonable maximum limit
    if (isNaN(increment) || increment <= 0 || increment > MAX_INCREMENT) {
        alert(`Please enter a valid number of Zyns to add (1 - ${MAX_INCREMENT}).`);
        return;
    }
    logUsage(increment);
    document.getElementById('zynIncrement').value = '';
});

document.getElementById('toggleChartButton').addEventListener('click', function () {
    toggleChartType();
});

document.getElementById('undoButton').addEventListener('click', () => {
    if (usageData.length > 0) {
        const lastUsageTime = new Date(usageData[usageData.length - 1]);
        const now = new Date();
        const timeDiff = now - lastUsageTime; // difference in milliseconds
        const oneHourMs = 60 * 60 * 1000; // one hour in milliseconds

        if (timeDiff <= oneHourMs) { //if the last usage was within the last hour
            removeUsage(1); // Remove the last Zyn entry
        } else {
            alert('Cannot undo actions older than 1 hour.');
        }
    } else {
        alert('No actions to undo.');
    }
});

// Event listeners for date navigation
document.getElementById('prevDayButton').addEventListener('click', function() {
    changeSelectedDate(-1);
});

document.getElementById('nextDayButton').addEventListener('click', function() {
    changeSelectedDate(1);
});

// Function to log usage
function logUsage(amount) {
    let now = new Date();
    for (let i = 0; i < amount; i++) {
        usageData.push(now.toISOString());
    }
    saveData();
    updateStats();
    renderChart();
    updateHourlyChart();
    updateDateNavigation();
}

// Function to remove usage
function removeUsage(amount) {
    usageData.splice(-amount, amount);
    saveData();
    updateStats();
    renderChart();
    updateHourlyChart();
    updateDateNavigation();
}

// Function to load data from localStorage
function loadData() {
    let data = localStorage.getItem('usageData');
    if (data) {
        usageData = JSON.parse(data);
    }
    let cans = localStorage.getItem('totalCans');
    if (cans) {
        totalCans = parseInt(cans);
    }
    let price = localStorage.getItem('pricePerCan');
    if (price) {
        pricePerCan = parseFloat(price);
    }
    
    // Load time format
    let savedTimeFormat = localStorage.getItem('timeFormat');
    if (savedTimeFormat) {
        timeFormat = savedTimeFormat;
    }

    // Load showHourlyAverages setting
    let savedShowAverages = localStorage.getItem('showHourlyAverages');
    if (savedShowAverages !== null) {
        showHourlyAverages = savedShowAverages === 'true';
    }
    
    // Load nicotine strength
    let savedNicotineStrength = localStorage.getItem('nicotineStrength');
    if (savedNicotineStrength) {
        nicotineStrength = parseFloat(savedNicotineStrength);
    }
}

// Function to save data to localStorage
function saveData() {
    localStorage.setItem('usageData', JSON.stringify(usageData));
    totalCans = Math.floor(getTotalZyns() / 15);
    localStorage.setItem('totalCans', totalCans);
    localStorage.setItem('pricePerCan', pricePerCan);
    localStorage.setItem('timeFormat', timeFormat); // Save time format
    localStorage.setItem('showHourlyAverages', showHourlyAverages);
    localStorage.setItem('nicotineStrength', nicotineStrength); // Save nicotine strength
}

// Function to update stats on the UI
function updateStats() {
    let todayUsage = getTodayUsage();
    document.getElementById('todayZyns').innerText = todayUsage;
    document.getElementById('totalCans').innerText = totalCans;
    document.getElementById('totalZynsUsed').innerText = getTotalZyns();

    // Calculate spending
    let spentToday = ((todayUsage / 15) * pricePerCan).toFixed(2);
    let totalSpent = (totalCans * pricePerCan).toFixed(2);

    document.getElementById('spentToday').innerText = `$${spentToday}`;
    document.getElementById('totalSpent').innerText = `$${totalSpent}`;

    // Calculate comparisons
    let avgUsage = getAverageUsage();
    let yesterdayUsage = getUsageForDaysAgo(1);
    let lastWeekUsage = getUsageForDaysAgo(7);

    updateComparison('Avg', todayUsage, avgUsage);
    updateComparison('Yesterday', todayUsage, yesterdayUsage);
    updateComparison('LastWeek', todayUsage, lastWeekUsage);

    // Update average time stats
    document.getElementById('avgTimeBetweenZyns').innerText = `${getAverageTimeBetweenZyns()} minutes`;
    document.getElementById('avgTimeToday').innerText = `${getAverageTimeBetweenZynsToday()} minutes`;
    document.getElementById('timeSinceLastUsed').innerText = getTimeSinceLastUsed();

    // Update earliest Zyn time today
    document.getElementById('earliestZynTime').innerText = getEarliestZynTimeToday();

    document.getElementById('last24HoursZyns').innerText = getLast24HoursUsage();
    
    // Calculate nicotine used today
    let todayNicotineUsed = getTodayUsage() * nicotineStrength;
    document.getElementById('todayNicotineUsed').innerText = `${todayNicotineUsed} mg`;
}

// Function to update comparison widgets
function updateComparison(idSuffix, current, previous) {
    let amountDiff = current - previous;
    let percentDiff = calculatePercentage(current, previous);
    let amountElem = document.getElementById('amount' + idSuffix);
    let percentElem = document.getElementById('percent' + idSuffix);

    // Set amount difference with +/- sign
    let amountSign = amountDiff > 0 ? '+' : amountDiff < 0 ? '-' : '';
    amountElem.innerText = amountSign + Math.abs(amountDiff).toFixed(2); // Truncated to 2 decimals

    // Set percentage difference with +/- sign
    let percentSign = percentDiff > 0 ? '+' : percentDiff < 0 ? '-' : '';
    percentElem.innerText = percentSign + Math.abs(percentDiff).toFixed(2) + '%'; // Truncated to 2 decimals

    // Set color based on increase or decrease
    let color = amountDiff > 0 ? 'red' : amountDiff < 0 ? 'green' : 'gray';
    amountElem.style.color = color;
    percentElem.style.color = color;
}

// Function to get total Zyns used
function getTotalZyns() {
    return usageData.length;
}

// Function to get today's usage
function getTodayUsage() {
    let today = getFormattedDate(new Date());
    return usageData.filter(timestamp => getFormattedDate(new Date(timestamp)) === today).length;
}

// Function to get average usage
function getAverageUsage() {
    let daysUsed = new Set(usageData.map(timestamp => getFormattedDate(new Date(timestamp)))).size || 1;
    return getTotalZyns() / daysUsed;
}

// Function to get usage for N days ago
function getUsageForDaysAgo(daysAgo) {
    let date = new Date();
    date.setDate(date.getDate() - daysAgo);
    let formattedDate = getFormattedDate(date);
    return usageData.filter(timestamp => getFormattedDate(new Date(timestamp)) === formattedDate).length;
}

// Function to calculate percentage difference
function calculatePercentage(current, previous) {
    if (previous === 0) return 0;
    let diff = ((current - previous) / previous) * 100;
    return diff.toFixed(2); // Changed from toFixed(1) to toFixed(2)
}

// Function to get formatted date string
function getFormattedDate(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
}

// Function to calculate average time between Zyns used
function getAverageTimeBetweenZyns() {
    if (usageData.length < 2) return 0;
    let timestamps = usageData.map(timestamp => new Date(timestamp)).sort((a, b) => a - b);
    let totalDiff = 0;
    for (let i = 1; i < timestamps.length; i++) {
        totalDiff += (timestamps[i] - timestamps[i - 1]);
    }
    return (totalDiff / (usageData.length - 1) / (1000 * 60)).toFixed(2); // in minutes
}

// Function to calculate average time between Zyns used today
function getAverageTimeBetweenZynsToday() {
    let today = getFormattedDate(new Date());
    let todayTimestamps = usageData
        .filter(timestamp => getFormattedDate(new Date(timestamp)) === today)
        .map(timestamp => new Date(timestamp))
        .sort((a, b) => a - b);
    if (todayTimestamps.length < 2) return 0;
    let totalDiff = 0;
    for (let i = 1; i < todayTimestamps.length; i++) {
        totalDiff += (todayTimestamps[i] - todayTimestamps[i - 1]);
    }
    return (totalDiff / (todayTimestamps.length - 1) / (1000 * 60)).toFixed(2); // in minutes
}

// Function to calculate time since last used
function getTimeSinceLastUsed() {
    if (usageData.length === 0) return 'Never';
    let lastUsedTimestamp = new Date(usageData[usageData.length - 1]);
    let now = new Date();
    let diffMs = now - lastUsedTimestamp;
    let diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    let diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m ago`;
}

// Function to get earliest Zyn time today
function getEarliestZynTimeToday() {
    let today = getFormattedDate(new Date());
    let todayTimestamps = usageData
        .filter(timestamp => getFormattedDate(new Date(timestamp)) === today)
        .map(timestamp => new Date(timestamp))
        .sort((a, b) => a - b);
    if (todayTimestamps.length === 0) return 'No Zyns used today';
    let earliestTime = todayTimestamps[0];
    return formatTime(earliestTime);
}

// Function to format time as 'HH:MM AM/PM'
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert hour '0' to '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
}

// Function to render the chart
function renderChart() {
    let labels = [];
    let data = [];
    let date = new Date();
    let daysToShow = currentChartType === 'line' ? 14 : 7;

    for (let i = daysToShow - 1; i >= 0; i--) {
        let tempDate = new Date(date);
        tempDate.setDate(date.getDate() - i);
        let formattedDate = getFormattedDate(tempDate);
        labels.push(formattedDate);
        data.push(usageData.filter(timestamp => getFormattedDate(new Date(timestamp)) === formattedDate).length);
    }

    if (chart) {
        chart.destroy();
    }

    let ctx = document.getElementById('usageChart').getContext('2d');

    if (currentChartType === 'doughnut') {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Zyns Used',
                    data: data,
                    backgroundColor: [
                        '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#007aff', '#5856d6'
                    ],
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                maintainAspectRatio: false,
            }
        });
    } else if (currentChartType === 'line') {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(label => formatChartLabel(label)),
                datasets: [{
                    label: 'Daily Zyn Usage',
                    data: data,
                    borderColor: '#ff9500',
                    backgroundColor: 'rgba(255, 149, 0, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#ff9500',
                    pointHoverBackgroundColor: '#ff9500',
                    pointHoverBorderColor: '#ffffff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                scales: {
                    x: {
                        ticks: { color: '#ffffff', font: { size: 12 } },
                        grid: { display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#ffffff', font: { size: 12 } },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ` ${context.parsed.y} Zyns`;
                            }
                        }
                    }
                },
                maintainAspectRatio: false,
            }
        });
    }
}

// Function to format chart labels based on time format
function formatChartLabel(label) {
    return label;
}

// Function to toggle chart type
function toggleChartType() {
    if (currentChartType === 'doughnut') {
        currentChartType = 'line';
        document.getElementById('toggleChartButton').innerText = 'Switch to Doughnut Chart';
    } else {
        currentChartType = 'doughnut';
        document.getElementById('toggleChartButton').innerText = 'Switch to Line Chart';
    }
    renderChart();
}

// Function to change the selected date
function changeSelectedDate(delta) {
    selectedDate.setDate(selectedDate.getDate() + delta);
    selectedDate = getDateWithoutTime(selectedDate); // Zero out time components
    updateHourlyChart();
    updateDateNavigation();
}

// Function to update the date navigation controls
function updateDateNavigation() {
    if (usageData.length === 0) {
        // Disable navigation if no data
        document.getElementById('prevDayButton').disabled = true;
        document.getElementById('nextDayButton').disabled = true;
        document.getElementById('selectedDate').innerText = 'No Data';
        return;
    }

    // Find the earliest and latest dates with data
    let datesWithData = usageData.map(timestamp => getDateWithoutTime(new Date(timestamp)));
    earliestDateWithData = new Date(Math.min(...datesWithData.map(date => date.getTime())));
    latestDateWithData = new Date(Math.max(...datesWithData.map(date => date.getTime())));

    // Disable prev button if selectedDate is less than or equal to earliestDateWithData
    if (selectedDate <= earliestDateWithData) {
        document.getElementById('prevDayButton').disabled = true;
    } else {
        document.getElementById('prevDayButton').disabled = false;
    }

    // Disable next button only if selectedDate is today or later
    let today = getDateWithoutTime(new Date());
    if (selectedDate >= today) {
        document.getElementById('nextDayButton').disabled = true;
    } else {
        document.getElementById('nextDayButton').disabled = false;
    }

    // Update the displayed date
    document.getElementById('selectedDate').innerText = selectedDate.toDateString();
}

// Function to calculate hourly averages
function calculateHourlyAverages() {
    let hourlyCounts = new Array(24).fill(0);
    usageData.forEach(timestamp => {
        let date = new Date(timestamp);
        let hour = date.getHours();
        hourlyCounts[hour]++;
    });
    if (usageData.length === 0) {
        var totalDays = 1;
    } else {
        const firstTimestamp = Math.min(...usageData.map(t => new Date(t).getTime()));
        const firstDate = getDateWithoutTime(new Date(firstTimestamp));
        const today = getDateWithoutTime(new Date());
        const timeDiff = today - firstDate;
        const dayInMs = 1000 * 60 * 60 * 24;
        var totalDays = Math.floor(timeDiff / dayInMs) + 1; // Add 1 to include both first day and today
        totalDays = Math.max(totalDays, 1); // Ensure at least one day is counted
    }
    
    return hourlyCounts.map(count => (count / totalDays).toFixed(2));
}

// Function to render the hourly breakdown chart
function updateHourlyChart() {
    // Prepare data for the selected date
    let hourlyData = new Array(24).fill(0);
    let selectedDateStr = getFormattedDate(selectedDate);

    usageData.forEach(timestamp => {
        let date = new Date(timestamp);
        if (getFormattedDate(date) === selectedDateStr) {
            let hour = date.getHours();
            hourlyData[hour]++;
        }
    });

    // Calculate hourly averages
    let hourlyAverages = calculateHourlyAverages();

    // Render or update the chart
    if (hourlyChart) {
        // Update existing chart data
        hourlyChart.data.labels = hourlyData.map((_, h) => formatHourLabel(h));
        hourlyChart.data.datasets[0].data = hourlyData;
        if (showHourlyAverages) {
            if (hourlyChart.data.datasets.length < 2) {
                hourlyChart.data.datasets.push({
                    label: 'Hourly Average',
                    data: hourlyAverages,
                    backgroundColor: '#4cd964',
                });
            } else {
                hourlyChart.data.datasets[1].data = hourlyAverages;
            }
        } else {
            hourlyChart.data.datasets = hourlyChart.data.datasets.slice(0, 1);
        }
        hourlyChart.update();
    } else {
        // Create new chart
        let ctx = document.getElementById('hourlyChart').getContext('2d');
        let datasets = [{
            label: 'Zyns Used',
            data: hourlyData,
            backgroundColor: '#ff9500',
        }];
        if (showHourlyAverages) {
            datasets.push({
                label: 'Hourly Average',
                data: hourlyAverages,
                backgroundColor: '#4cd964',
            });
        }
        hourlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [...Array(24).keys()].map(h => formatHourLabel(h)),
                datasets: datasets
            },
            options: {
                scales: {
                    x: {
                        ticks: { color: '#ffffff', font: { size: 12 } },
                        grid: { display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#ffffff', 
                            font: { size: 12 }, 
                            stepSize: 1 
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        max: Math.max(...hourlyData, ...hourlyAverages) + 1 || 5, // Set max dynamically
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                layout: {
                    padding: {
                        bottom: 30, // Added bottom padding to prevent label clipping
                    },
                },
                maintainAspectRatio: false,
            }
        });
    }
}

// Function to format hour labels based on time format
function formatHourLabel(hour) {
    if (timeFormat === '12') {
        let period = hour >= 12 ? 'PM' : 'AM';
        let standardHour = hour % 12 || 12;
        return `${standardHour}:00 ${period}`;
    }
    return `${hour}:00`;
}

// Function to get Zyns used in the last 24 hours
function getLast24HoursUsage() {
    let now = new Date();
    let cutoff = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    return usageData.filter(timestamp => new Date(timestamp) >= cutoff).length;
}

// Function to clear all data
function clearAllData() {
    usageData = [];
    totalCans = 0;
    // Remove the quit plan from localStorage
    localStorage.removeItem('quitPlan');
    // Save data and update UI
    saveData();
    updateStats();
    renderChart();
    updateHourlyChart();
    updateDateNavigation();
    // Re-render the quit plan calendar
    renderQuitPlanCalendar();
}

// Call renderQuitPlanCalendar when settings are updated
function updateSettings() {
    renderQuitPlanCalendar();
}

// Make necessary functions globally accessible
window.saveData = saveData;
window.updateHourlyChart = updateHourlyChart;
window.updateStats = updateStats;
window.renderChart = renderChart;
