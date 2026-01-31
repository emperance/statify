/**
 * Statistical Calculator - Application Controller
 * Handles UI interactions, AJAX calls, and DOM manipulation
 */

document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // DOM Elements
        elements: {
            dataInput: document.getElementById('dataInput'),
            numClasses: document.getElementById('numClasses'),
            calculateBtn: document.getElementById('calculateBtn'),
            clearBtn: document.getElementById('clearBtn'),
            resultsGrid: document.getElementById('resultsGrid'),
            resultsSection: document.getElementById('resultsSection'),
            historyList: document.getElementById('historyList'),
            historySection: document.getElementById('historySection'),
            toastContainer: document.getElementById('toastContainer'),
            // New elements
            inputTabs: document.querySelectorAll('.input-tab'),
            tabContents: document.querySelectorAll('.tab-content'),
            csvFileInput: document.getElementById('csvFileInput'),
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            removeFile: document.getElementById('removeFile'),
            sampleBtns: document.querySelectorAll('.sample-btn'),
            exportCsvBtn: document.getElementById('exportCsvBtn'),
            printBtn: document.getElementById('printBtn')
        },

        // State
        state: {
            isLoading: false,
            currentResults: null,
            currentData: null,
            history: []
        },

        // Initialize application
        init() {
            this.bindEvents();
            this.loadHistory();
            this.checkForSavedInput();
        },

        // Bind event listeners
        bindEvents() {
            // Calculate button
            this.elements.calculateBtn?.addEventListener('click', () => this.handleCalculate());

            // Clear button
            this.elements.clearBtn?.addEventListener('click', () => this.handleClear());

            // Enter key in input
            this.elements.dataInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleCalculate();
                }
            });

            // Auto-save input on change
            this.elements.dataInput?.addEventListener('input', () => {
                this.saveInputToStorage();
            });

            // Real-time validation
            this.elements.dataInput?.addEventListener('input', () => {
                this.validateInputRealtime();
            });

            // Tab switching
            this.elements.inputTabs.forEach(tab => {
                tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
            });

            // File upload
            this.elements.dropZone?.addEventListener('click', () => {
                this.elements.csvFileInput?.click();
            });

            this.elements.csvFileInput?.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0]);
            });

            // Drag and drop
            this.elements.dropZone?.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.elements.dropZone.classList.add('dragover');
            });

            this.elements.dropZone?.addEventListener('dragleave', () => {
                this.elements.dropZone.classList.remove('dragover');
            });

            this.elements.dropZone?.addEventListener('drop', (e) => {
                e.preventDefault();
                this.elements.dropZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                this.handleFileSelect(file);
            });

            // Remove file
            this.elements.removeFile?.addEventListener('click', () => {
                this.clearFileUpload();
            });

            // Sample data buttons
            this.elements.sampleBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const sampleKey = btn.dataset.sample;
                    this.loadSampleData(sampleKey);
                });
            });

            // Export buttons
            this.elements.exportCsvBtn?.addEventListener('click', () => this.exportToCsv());
            this.elements.printBtn?.addEventListener('click', () => this.printResults());
        },

        // Switch between input tabs
        switchTab(tabId) {
            // Update tab buttons
            this.elements.inputTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabId);
            });

            // Update tab contents
            this.elements.tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `tab-${tabId}`);
            });
        },

        // Handle file selection
        handleFileSelect(file) {
            if (!file) return;

            // Validate file type
            if (!file.name.match(/\.(csv|txt)$/i)) {
                this.showToast('Please upload a CSV or TXT file', 'error');
                return;
            }

            // Show file info
            this.elements.fileInfo?.classList.remove('hidden');
            if (this.elements.fileName) {
                this.elements.fileName.textContent = file.name;
            }

            // Read file
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                this.parseCSV(content);
            };
            reader.onerror = () => {
                this.showToast('Error reading file', 'error');
            };
            reader.readAsText(file);
        },

        // Parse CSV content
        parseCSV(content) {
            // Split by common delimiters
            const values = content
                .split(/[\r\n,;]+/)
                .map(v => v.trim())
                .filter(v => v !== '')
                .map(v => parseFloat(v))
                .filter(v => !isNaN(v) && isFinite(v));

            if (values.length === 0) {
                this.showToast('No valid numbers found in file', 'error');
                return;
            }

            // Set data in textarea (switch to manual tab)
            if (this.elements.dataInput) {
                this.elements.dataInput.value = values.join(', ');
            }

            this.switchTab('manual');
            this.showToast(`Loaded ${values.length} values from file`, 'success');
        },

        // Clear file upload
        clearFileUpload() {
            this.elements.fileInfo?.classList.add('hidden');
            if (this.elements.csvFileInput) {
                this.elements.csvFileInput.value = '';
            }
        },

        // Load sample data
        loadSampleData(sampleKey) {
            if (typeof ChartManager !== 'undefined' && ChartManager.getSampleData) {
                const data = ChartManager.getSampleData(sampleKey);
                if (data && data.length > 0) {
                    if (this.elements.dataInput) {
                        this.elements.dataInput.value = data.join(', ');
                    }
                    this.switchTab('manual');
                    this.showToast(`Loaded ${data.length} sample values`, 'success');
                }
            }
        },

        // Handle calculate action
        async handleCalculate() {
            if (this.state.isLoading) return;

            const input = this.elements.dataInput?.value;
            const numClasses = parseInt(this.elements.numClasses?.value) || 5;

            // Validate input
            const validation = StatCalculator.validateInput(input);
            if (!validation.valid) {
                this.showToast(validation.error, 'error');
                return;
            }

            if (validation.warning) {
                this.showToast(validation.warning, 'info');
            }

            this.setLoading(true);

            try {
                // Calculate locally for instant feedback
                const results = StatCalculator.calculateAll(validation.data, numClasses);
                this.state.currentResults = results;
                this.state.currentData = validation.data;

                // Display results
                this.displayResults(results);

                // Update charts
                if (typeof ChartManager !== 'undefined') {
                    ChartManager.updateCharts(results, validation.data);
                }

                // Display AI insights
                if (typeof AIInsights !== 'undefined') {
                    AIInsights.display(results, validation.data);
                }

                // Update NL Query handler with current data context
                if (typeof NLQueryHandler !== 'undefined') {
                    NLQueryHandler.setDataContext(validation.data, results);
                }

                // Show results section
                this.elements.resultsSection?.classList.remove('hidden');

                // Save to history
                this.addToHistory(input, results);

                // Try to save to backend (non-blocking)
                this.saveToBackend(input, results);

                this.showToast('Calculations complete!', 'success');

                // Scroll to results
                this.elements.resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (error) {
                console.error('Calculation error:', error);
                this.showToast('Error performing calculations', 'error');
            } finally {
                this.setLoading(false);
            }
        },

        // Display results in grid
        displayResults(results) {
            if (!this.elements.resultsGrid) return;

            const resultCards = [
                { label: 'Count', value: results.count, key: 'count' },
                { label: 'Sum', value: results.sum, key: 'sum' },
                { label: 'Min', value: results.min, key: 'min' },
                { label: 'Max', value: results.max, key: 'max' },
                { label: 'Range', value: results.range, key: 'range' },
                { label: 'Mean', value: results.mean, key: 'mean' },
                { label: 'Median', value: results.median, key: 'median' },
                { label: 'Mode', value: this.formatMode(results.mode), key: 'mode', isMultiline: true },
                { label: 'Variance (Pop)', value: results.variancePopulation, key: 'variancePopulation' },
                { label: 'Variance (Sample)', value: results.varianceSample, key: 'varianceSample' },
                { label: 'Std Dev (Pop)', value: results.stdDevPopulation, key: 'stdDevPopulation' },
                { label: 'Std Dev (Sample)', value: results.stdDevSample, key: 'stdDevSample' },
                { label: 'Q1 (25%)', value: results.q1, key: 'q1' },
                { label: 'Q2 (Median)', value: results.q2, key: 'q2' },
                { label: 'Q3 (75%)', value: results.q3, key: 'q3' },
                { label: 'IQR', value: results.iqr, key: 'iqr' },
                { label: `Class Width (${results.numClasses} classes)`, value: results.classWidth, key: 'classWidth' }
            ];

            // Clear existing results
            this.elements.resultsGrid.innerHTML = '';

            // Create cards with staggered animation
            resultCards.forEach((card, index) => {
                const cardEl = this.createResultCard(card, index);
                this.elements.resultsGrid.appendChild(cardEl);
            });
        },

        // Create a result card element
        createResultCard(card, index) {
            const div = document.createElement('div');
            div.className = `result-card stagger-${Math.min(index + 1, 12)}`;
            div.dataset.key = card.key;
            div.dataset.value = card.value;

            const valueClass = card.isMultiline ? 'result-card__value result-card__value--multiline' : 'result-card__value';

            div.innerHTML = `
                <div class="result-card__label">${card.label}</div>
                <div class="${valueClass}">${card.value ?? 'N/A'}</div>
                <div class="result-card__copy">Click to copy</div>
            `;

            // Copy functionality
            div.addEventListener('click', () => this.copyValue(card.value, card.label, div));

            return div;
        },

        // Format mode array for display
        formatMode(modes) {
            if (!modes || modes.length === 0) return 'N/A';
            if (modes[0] === 'No mode') return 'No mode';
            if (modes.length > 3) {
                return `${modes.slice(0, 3).join(', ')}...`;
            }
            return modes.join(', ');
        },

        // Copy value to clipboard
        async copyValue(value, label, element) {
            if (value === null || value === 'N/A') return;

            try {
                await navigator.clipboard.writeText(value.toString());

                // Show copied indicator
                element.classList.add('result-card--success');
                setTimeout(() => element.classList.remove('result-card--success'), 300);

                // Show tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'copied-tooltip';
                tooltip.textContent = 'Copied!';
                element.style.position = 'relative';
                element.appendChild(tooltip);

                setTimeout(() => tooltip.remove(), 1500);

            } catch (err) {
                this.showToast('Failed to copy', 'error');
            }
        },

        // Export results to CSV
        exportToCsv() {
            if (!this.state.currentResults) {
                this.showToast('No results to export', 'error');
                return;
            }

            const results = this.state.currentResults;
            const csvContent = [
                ['Statistic', 'Value'],
                ['Count', results.count],
                ['Sum', results.sum],
                ['Min', results.min],
                ['Max', results.max],
                ['Range', results.range],
                ['Mean', results.mean],
                ['Median', results.median],
                ['Mode', Array.isArray(results.mode) ? results.mode.join('; ') : results.mode],
                ['Variance (Population)', results.variancePopulation],
                ['Variance (Sample)', results.varianceSample],
                ['Std Dev (Population)', results.stdDevPopulation],
                ['Std Dev (Sample)', results.stdDevSample],
                ['Q1', results.q1],
                ['Q2 (Median)', results.q2],
                ['Q3', results.q3],
                ['IQR', results.iqr],
                ['Class Width', results.classWidth],
                ['', ''],
                ['Raw Data', this.state.currentData ? this.state.currentData.join(', ') : '']
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `statistics_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('CSV exported successfully!', 'success');
        },

        // Print results
        printResults() {
            if (!this.state.currentResults) {
                this.showToast('No results to print', 'error');
                return;
            }
            window.print();
        },

        // Handle clear action
        handleClear() {
            if (this.elements.dataInput) {
                this.elements.dataInput.value = '';
            }
            if (this.elements.numClasses) {
                this.elements.numClasses.value = '5';
            }
            if (this.elements.resultsSection) {
                this.elements.resultsSection.classList.add('hidden');
            }
            if (this.elements.resultsGrid) {
                this.elements.resultsGrid.innerHTML = '';
            }

            // Clear charts
            if (typeof ChartManager !== 'undefined') {
                ChartManager.destroyCharts();
            }

            // Clear file upload
            this.clearFileUpload();

            this.state.currentResults = null;
            this.state.currentData = null;
            this.clearInputStorage();
            this.showToast('Cleared!', 'info');
        },

        // Set loading state
        setLoading(isLoading) {
            this.state.isLoading = isLoading;

            if (this.elements.calculateBtn) {
                this.elements.calculateBtn.disabled = isLoading;
                this.elements.calculateBtn.innerHTML = isLoading
                    ? '<span class="spinner"></span> Calculating...'
                    : 'Calculate';
            }

            document.body.classList.toggle('loading', isLoading);
        },

        // Validate input in real-time
        validateInputRealtime() {
            const input = this.elements.dataInput?.value;
            const validation = StatCalculator.validateInput(input);

            if (input && !validation.valid) {
                this.elements.dataInput?.classList.add('input-error');
            } else {
                this.elements.dataInput?.classList.remove('input-error');
            }
        },

        // Show toast notification
        showToast(message, type = 'info') {
            if (!this.elements.toastContainer) {
                // Create container if doesn't exist
                const container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'toast-container';
                document.body.appendChild(container);
                this.elements.toastContainer = container;
            }

            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            toast.textContent = message;

            this.elements.toastContainer.appendChild(toast);

            // Remove after animation
            setTimeout(() => toast.remove(), 3000);
        },

        // Save to backend via AJAX
        async saveToBackend(input, results) {
            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input: input,
                        results: results
                    })
                });

                if (!response.ok) {
                    console.warn('Backend save failed:', response.status);
                }
            } catch (error) {
                console.warn('Backend not available:', error.message);
            }
        },

        // Local storage operations
        saveInputToStorage() {
            const input = this.elements.dataInput?.value;
            if (input) {
                localStorage.setItem('statCalc_lastInput', input);
            }
        },

        clearInputStorage() {
            localStorage.removeItem('statCalc_lastInput');
        },

        checkForSavedInput() {
            const saved = localStorage.getItem('statCalc_lastInput');
            if (saved && this.elements.dataInput) {
                this.elements.dataInput.value = saved;
            }
        },

        // History management
        addToHistory(input, results) {
            const entry = {
                id: Date.now(),
                input: input.substring(0, 50), // Truncate for display
                mean: results.mean,
                timestamp: new Date().toISOString()
            };

            this.state.history.unshift(entry);

            // Keep only last 10 entries
            if (this.state.history.length > 10) {
                this.state.history = this.state.history.slice(0, 10);
            }

            this.saveHistory();
            this.renderHistory();
        },

        loadHistory() {
            try {
                const saved = localStorage.getItem('statCalc_history');
                if (saved) {
                    this.state.history = JSON.parse(saved);
                    this.renderHistory();
                }
            } catch (e) {
                console.warn('Failed to load history:', e);
            }
        },

        saveHistory() {
            localStorage.setItem('statCalc_history', JSON.stringify(this.state.history));
        },

        renderHistory() {
            if (!this.elements.historyList) return;

            if (this.state.history.length === 0) {
                this.elements.historySection?.classList.add('hidden');
                return;
            }

            this.elements.historySection?.classList.remove('hidden');
            this.elements.historyList.innerHTML = '';

            this.state.history.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-item__data">${this.escapeHtml(entry.input)}${entry.input.length >= 50 ? '...' : ''}</div>
                    <div class="history-item__time">Mean: ${entry.mean} • ${this.formatTime(entry.timestamp)}</div>
                `;

                item.addEventListener('click', () => {
                    // Restore full input from localStorage if available
                    if (this.elements.dataInput) {
                        const fullHistory = localStorage.getItem('statCalc_fullHistory_' + entry.id);
                        this.elements.dataInput.value = fullHistory || entry.input;
                        this.elements.dataInput.focus();
                    }
                });

                this.elements.historyList.appendChild(item);
            });
        },

        // Utility functions
        formatTime(isoString) {
            const date = new Date(isoString);
            return date.toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize the application
    App.init();
});
