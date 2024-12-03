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

        // Handle settings section switching
        document.querySelectorAll('.settings-sidebar li').forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all
                document.querySelectorAll('.settings-sidebar li').forEach(li => li.classList.remove('active'));
                // Add active class to the clicked item
                this.classList.add('active');
                
                // Hide all sections
                document.querySelectorAll('.settings-section').forEach(section => section.style.display = 'none');
                // Show the selected section
                const section = document.getElementById(this.getAttribute('data-section'));
                if (section) {
                    section.style.display = 'block';
                }
            });
        });

        // Automatically save settings on change
        function autoSaveSetting(key, value) {
            localStorage.setItem(key, value);
            saveData();
            updateStats();
            updateHourlyChart();
            renderChart();
        }

        document.getElementById('pricePerCan').addEventListener('change', function() {
            let newPrice = parseFloat(this.value);
            if (!isNaN(newPrice) && newPrice > 0) {
                pricePerCan = newPrice;
                autoSaveSetting('pricePerCan', newPrice.toFixed(2));
            } else {
                alert('Please enter a valid price per can.');
                this.value = pricePerCan.toFixed(2);
            }
        });

        document.getElementsByName('timeFormat').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    timeFormat = this.value;
                    autoSaveSetting('timeFormat', this.value);
                }
            });
        });

        document.getElementById('showAverages').addEventListener('change', function() {
            showHourlyAverages = this.checked;
            autoSaveSetting('showHourlyAverages', this.checked);
        });

        document.getElementById('nicotineStrength').addEventListener('change', function() {
            let newNicotine = parseFloat(this.value);
            if (!isNaN(newNicotine) && newNicotine >= 1) {
                nicotineStrength = newNicotine;
                autoSaveSetting('nicotineStrength', newNicotine);
            } else {
                alert('Please enter a valid nicotine strength.');
                this.value = nicotineStrength;
            }
        });

        // Any other settings-related code...
    })
    .catch(error => console.error('Error loading settings modal:', error));
