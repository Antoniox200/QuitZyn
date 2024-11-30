// Initialize variables
let usageData = {};
let totalCans = 0;
let chart;
let currentChartType = 'line'; // Default chart type
let pricePerCan = 5.99; // Default price per can including NYC sales tax
let actionStack = [];

// Load data from localStorage on page load
window.onload = function () {
    loadData();
    updateStats();
    renderChart();
};

// Event listeners for buttons
document.getElementById('incrementButton').addEventListener('click', function () {
    logUsage(1);
    actionStack.push({ action: 'increment', amount: 1 });
});

document.getElementById('addButton').addEventListener('click', function () {
    let increment = parseInt(document.getElementById('zynIncrement').value);
    if (isNaN(increment) || increment <= 0) {
        alert('Please enter a valid number of Zyns to add.');
        return;
    }
    logUsage(increment);
    actionStack.push({ action: 'add', amount: increment });
    document.getElementById('zynIncrement').value = '';
});

document.getElementById('toggleChartButton').addEventListener('click', function () {
    toggleChartType();
});

document.getElementById('undoButton').addEventListener('click', () => {
    if (actionStack.length > 0) {
        let lastAction = actionStack.pop();
        if (lastAction.action === 'increment') {
            logUsage(-lastAction.amount);
        } else if (lastAction.action === 'add') {
            logUsage(-lastAction.amount);
        }
    }
});

// Function to log usage
function logUsage(amount) {
    let today = getFormattedDate(new Date());
    if (!usageData[today]) {
        usageData[today] = 0;
    }
    usageData[today] += amount;
    if (usageData[today] < 0) {
        usageData[today] = 0;
    }
    saveData();
    updateStats();
    renderChart();
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
        document.getElementById('pricePerCan').value = pricePerCan.toFixed(2);
    } else {
        document.getElementById('pricePerCan').value = pricePerCan.toFixed(2);
    }
}

// Function to save data to localStorage
function saveData() {
    localStorage.setItem('usageData', JSON.stringify(usageData));
    totalCans = Math.floor(getTotalZyns() / 15);
    localStorage.setItem('totalCans', totalCans);
    localStorage.setItem('pricePerCan', pricePerCan);
}

// Function to update stats on the UI
function updateStats() {
    let today = getFormattedDate(new Date());
    let todayUsage = usageData[today] || 0;
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
}

// Function to update comparison widgets
function updateComparison(idSuffix, current, previous) {
    let amountDiff = current - previous;
    let percentDiff = calculatePercentage(current, previous);
    let amountElem = document.getElementById('amount' + idSuffix);
    let percentElem = document.getElementById('percent' + idSuffix);

    // Set amount difference with +/- sign
    let amountSign = amountDiff > 0 ? '+' : amountDiff < 0 ? '-' : '';
    amountElem.innerText = amountSign + Math.abs(amountDiff);

    // Set percentage difference with +/- sign
    let percentSign = percentDiff > 0 ? '+' : percentDiff < 0 ? '-' : '';
    percentElem.innerText = percentSign + Math.abs(percentDiff) + '%';

    // Set color based on increase or decrease
    let color = amountDiff > 0 ? 'red' : amountDiff < 0 ? 'green' : 'gray';
    amountElem.style.color = color;
    percentElem.style.color = color;
}

// Function to get total Zyns used
function getTotalZyns() {
    return Object.values(usageData).reduce((a, b) => a + b, 0);
}

// Function to get average usage
function getAverageUsage() {
    let total = getTotalZyns();
    let days = Object.keys(usageData).length || 1;
    return total / days;
}

// Function to get usage for N days ago
function getUsageForDaysAgo(daysAgo) {
    let date = new Date();
    date.setDate(date.getDate() - daysAgo);
    let formattedDate = getFormattedDate(date);
    return usageData[formattedDate] || 0;
}

// Function to calculate percentage difference
function calculatePercentage(current, previous) {
    if (previous === 0) return 0;
    let diff = ((current - previous) / previous) * 100;
    return diff.toFixed(1);
}

// Function to get formatted date string
function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
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
        data.push(usageData[formattedDate] || 0);
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
                labels: labels,
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

// Modal functionality

// Get modal elements
let modal = document.getElementById('settingsModal');
let settingsButton = document.getElementById('settingsButton');
let closeModal = document.getElementById('closeModal');
let clearDataButton = document.getElementById('clearDataButton');
let saveSettingsButton = document.getElementById('saveSettingsButton');

// Open the modal when settings button is clicked
settingsButton.onclick = function () {
    modal.style.display = 'block';
};

// Close the modal when close button is clicked
closeModal.onclick = function () {
    modal.style.display = 'none';
};

// Close the modal when clicking outside of modal content
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Save settings
saveSettingsButton.onclick = function () {
    let newPrice = parseFloat(document.getElementById('pricePerCan').value);
    if (isNaN(newPrice) || newPrice <= 0) {
        alert('Please enter a valid price per can.');
        return;
    }
    pricePerCan = newPrice;
    saveData();
    updateStats();
    alert('Settings saved successfully.');
    modal.style.display = 'none';
};

// Clear data with confirmation
clearDataButton.onclick = function () {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        clearAllData();
        modal.style.display = 'none';
    }
};

// Function to clear all data
function clearAllData() {
    usageData = {};
    totalCans = 0;
    localStorage.removeItem('usageData');
    localStorage.removeItem('totalCans');
    updateStats();
    renderChart();
}
