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

        // Any other settings-related code...
    })
    .catch(error => console.error('Error loading settings modal:', error));
