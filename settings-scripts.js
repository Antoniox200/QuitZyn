// Load the settings modal HTML into the page
fetch('settingsmodal.html')
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML('beforeend', data);

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

        // Initialize settings modal inputs with data from localStorage
        function initializeSettings() {
            let pricePerCanInput = document.getElementById('pricePerCan');
            if (pricePerCanInput) {
                let storedPrice = localStorage.getItem('pricePerCan');
                pricePerCanInput.value = storedPrice ? parseFloat(storedPrice).toFixed(2) : '5.99';
            }

            let showAveragesCheckbox = document.getElementById('showAverages');
            if (showAveragesCheckbox) {
                let storedShowAverages = localStorage.getItem('showHourlyAverages');
                showAveragesCheckbox.checked = storedShowAverages === 'true' || true;
            }

            let nicotineStrengthInput = document.getElementById('nicotineStrength');
            if (nicotineStrengthInput) {
                let storedNicotine = localStorage.getItem('nicotineStrength');
                nicotineStrengthInput.value = storedNicotine ? parseFloat(storedNicotine) : '3';
            }

            let timeFormatRadios = document.getElementsByName('timeFormat');
            let storedTimeFormat = localStorage.getItem('timeFormat') || '24';
            timeFormatRadios.forEach(radio => {
                radio.checked = radio.value === storedTimeFormat;
            });
        }

        // Call initializeSettings after a short delay to ensure script.js has loaded data
        setTimeout(initializeSettings, 100);

        // Save settings
        saveSettingsButton.onclick = function () {
            let newPrice = parseFloat(document.getElementById('pricePerCan').value);
            if (isNaN(newPrice) || newPrice <= 0) {
                alert('Please enter a valid price per can.');
                return;
            }
            pricePerCan = newPrice;

            // Get selected time format
            let radios = document.getElementsByName('timeFormat');
            for (let i = 0; i < radios.length; i++) {
                if (radios[i].checked) {
                    timeFormat = radios[i].value;
                    break;
                }
            }

            // Save nicotine strength
            let newNicotineStrength = parseFloat(document.getElementById('nicotineStrength').value);
            if (isNaN(newNicotineStrength) || newNicotineStrength <= 0) {
                alert('Please enter a valid nicotine strength.');
                return;
            }
            nicotineStrength = newNicotineStrength;

            saveData();
            updateStats();
            updateHourlyChart();
            renderChart();
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

        // Add the event listener for 'showAverages'
        document.getElementById('showAverages').addEventListener('change', function() {
            showHourlyAverages = this.checked;
            saveData();
            updateHourlyChart();
        });

        // Any other settings-related code...
    })
    .catch(error => console.error('Error loading settings modal:', error));
