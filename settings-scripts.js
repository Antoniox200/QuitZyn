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

            // Initialize aggressiveness level
            let aggressivenessSlider = document.getElementById('aggressivenessLevel');
            if (aggressivenessSlider) {
                let storedLevel = localStorage.getItem('aggressivenessLevel') || '2';
                aggressivenessSlider.value = storedLevel;
            }

            // Initialize aggressiveness level with the new selector
            let storedLevel = localStorage.getItem('aggressivenessLevel') || '2';
            updateSelectorPosition(storedLevel);
            updateOptionStyles(storedLevel);

            // Add event listener for the 'Regenerate Quit Plan' button
            const regenerateButton = document.getElementById('regenerateQuitPlanButton');
            if (regenerateButton) {
                regenerateButton.addEventListener('click', function() {
                    regenerateQuitPlan();
                    alert('Quit plan has been regenerated.');
                });
            }

            // Add event listener for the manual average consumption input
            const submitManualAvgButton = document.getElementById('submitManualAvg');
            if (submitManualAvgButton) {
                submitManualAvgButton.addEventListener('click', function() {
                    const manualAvgInput = document.getElementById('manualAvgConsumption');
                    const manualAvg = parseFloat(manualAvgInput.value);
                    if (!isNaN(manualAvg) && manualAvg > 0) {
                        regenerateQuitPlan(manualAvg);
                        alert('Quit plan has been regenerated based on your input.');
                    } else {
                        alert('Please enter a valid average consumption.');
                    }
                });
            }

            // Initialize Cigarette Mode
            let cigaretteModeCheckbox = document.getElementById('cigaretteMode');
            if (cigaretteModeCheckbox) {
                let storedCigaretteMode = localStorage.getItem('cigaretteMode') === 'true';
                cigaretteModeCheckbox.checked = storedCigaretteMode;
                updateCigaretteMode(storedCigaretteMode);
            }

            // Add event listener for Cigarette Mode
            if (cigaretteModeCheckbox) {
                cigaretteModeCheckbox.addEventListener('change', function() {
                    let isEnabled = this.checked;
                    localStorage.setItem('cigaretteMode', isEnabled);
                    updateCigaretteMode(isEnabled);
                    // Optional: Re-render charts or update other components if necessary
                });
            }
        }

        // Define functions for updating selector position and option styles
        let options = document.querySelectorAll('.aggressiveness-selector .option');
        let selector = document.querySelector('.aggressiveness-selector .selector');

        function updateSelectorPosition(value) {
            let index = parseInt(value) - 1;
            selector.style.left = `calc(${index * 100}% / 3)`;
        }

        function updateOptionStyles(value) {
            options.forEach(option => {
                if (option.getAttribute('data-value') === value) {
                    option.style.color = '#000000';
                } else {
                    option.style.color = '#ffffff';
                }
            });
        }

        // Add click event listeners to options
        options.forEach(option => {
            option.addEventListener('click', function() {
                let value = this.getAttribute('data-value');
                localStorage.setItem('aggressivenessLevel', value);
                updateSelectorPosition(value);
                updateOptionStyles(value);
                // Regenerate and render the quit plan calendar
                regenerateQuitPlan();
            });
        });

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

        document.getElementById('aggressivenessLevel').addEventListener('change', function() {
            let level = this.value;
            localStorage.setItem('aggressivenessLevel', level);
            // Regenerate and render the quit plan calendar
            renderQuitPlanCalendar();
        });

        // Helper function to get the aggressiveness label
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

        // Function to update UI based on Cigarette Mode
        function updateCigaretteMode(isEnabled) {
            // Dispatch a custom event to notify other scripts
            document.dispatchEvent(new CustomEvent('cigaretteModeChanged', { detail: isEnabled }));
        }

        // Any other settings-related code...
    })
    .catch(error => console.error('Error loading settings modal:', error));
