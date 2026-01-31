/**
 * PDF & File Processor
 * Handles PDF and CSV file uploads, text extraction, and number parsing
 */

class PDFProcessor {
    constructor() {
        this.extractedNumbers = null;
        this.filename = null;
        this.attachEventListeners();
    }

    attachEventListeners() {
        const pdfInput = document.getElementById('pdf-upload');
        const csvInput = document.getElementById('csvFileInput');

        if (pdfInput) {
            pdfInput.addEventListener('change', (e) => this.handlePDFUpload(e));
        }

        // Enhance existing CSV handler if not already present
        if (csvInput && !csvInput._pdfProcessorAttached) {
            csvInput.addEventListener('change', (e) => this.handleCSVUpload(e));
            csvInput._pdfProcessorAttached = true;
        }
    }

    async handlePDFUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const preview = document.getElementById('pdf-file-preview');
        if (!preview) return;

        preview.innerHTML = `
            <div class="file-processing">
                <div class="file-spinner"></div>
                <p>Processing PDF: <strong>${file.name}</strong></p>
                <p class="processing-status">Initializing...</p>
                <div class="pdf-progress-bar">
                    <div class="pdf-progress-fill" id="pdf-progress"></div>
                </div>
            </div>
        `;

        try {
            // Check if PDF.js is loaded
            if (!window.pdfjsLib) {
                throw new Error('PDF.js library not loaded');
            }

            pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            // Read file
            const arrayBuffer = await file.arrayBuffer();

            // Update status
            preview.querySelector('.processing-status').textContent = 'Loading PDF...';

            // Load PDF
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let allText = '';
            const totalPages = pdf.numPages;

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                allText += pageText + '\n';

                // Update progress
                const progress = Math.round((pageNum / totalPages) * 100);
                preview.querySelector('.processing-status').textContent =
                    `Reading page ${pageNum} of ${totalPages}...`;
                preview.querySelector('#pdf-progress').style.width = progress + '%';
            }

            // Parse numbers
            const numbers = this.extractNumbersFromText(allText);

            if (numbers.length === 0) {
                this.showNoResults(preview, 'PDF');
                return;
            }

            this.displayResults(preview, file.name, numbers, allText.substring(0, 300), 'pdf');

        } catch (error) {
            console.error('PDF processing error:', error);
            preview.innerHTML = `
                <div class="file-error">
                    <span class="error-icon">❌</span>
                    <p>Error processing PDF</p>
                    <p class="error-details">${error.message}</p>
                    <button onclick="pdfProcessor.clearUpload('pdf')" class="btn-retry">Try Again</button>
                </div>
            `;
        }
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const preview = document.getElementById('csv-file-preview') || document.getElementById('fileInfo');
        if (!preview) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const numbers = this.parseCSV(text);

                if (numbers.length === 0) {
                    this.showNoResults(preview, 'CSV');
                    return;
                }

                this.displayResults(preview, file.name, numbers, text.substring(0, 300), 'csv');

            } catch (error) {
                console.error('CSV processing error:', error);
                preview.innerHTML = `
                    <div class="file-error">
                        <span class="error-icon">❌</span>
                        <p>Error processing CSV</p>
                        <p class="error-details">${error.message}</p>
                        <button onclick="pdfProcessor.clearUpload('csv')" class="btn-retry">Try Again</button>
                    </div>
                `;
            }
        };

        reader.readAsText(file);
    }

    parseCSV(text) {
        const numbers = [];
        const lines = text.split(/\r?\n/);

        lines.forEach(line => {
            const values = line.split(/[,;\t\s]+/);
            values.forEach(value => {
                const trimmed = value.trim();
                const num = parseFloat(trimmed);
                if (!isNaN(num) && isFinite(num)) {
                    numbers.push(num);
                }
            });
        });

        return numbers;
    }

    extractNumbersFromText(text) {
        const numbers = [];

        // Match integers, decimals, and negative numbers
        const numberPattern = /-?\d+\.?\d*/g;
        const matches = text.match(numberPattern);

        if (matches) {
            matches.forEach(match => {
                const num = parseFloat(match);
                if (!isNaN(num) && isFinite(num)) {
                    numbers.push(num);
                }
            });
        }

        return numbers;
    }

    showNoResults(container, fileType) {
        container.innerHTML = `
            <div class="file-error">
                <span class="error-icon"></span>
                <p>No numbers found in ${fileType}</p>
                <p class="error-details">Make sure the file contains numerical data.</p>
                <button onclick="pdfProcessor.clearUpload('${fileType.toLowerCase()}')" class="btn-retry">Try Another File</button>
            </div>
        `;
    }

    displayResults(container, filename, numbers, preview, fileType) {
        this.extractedNumbers = numbers;
        this.filename = filename;

        const icon = fileType === 'pdf' ? 'PDF' : 'CSV';

        container.innerHTML = `
            <div class="file-success">
                <div class="file-header">
                    <div class="file-info-row">
                        <span class="file-type-icon">${icon}</span>
                        <div>
                            <strong>${filename}</strong>
                            <p>${numbers.length} numbers extracted</p>
                        </div>
                    </div>
                    <button class="btn-remove-file" onclick="pdfProcessor.clearUpload('${fileType}')">✕</button>
                </div>
                
                <div class="extracted-preview">
                    <strong>File Preview:</strong>
                    <pre>${this.escapeHtml(preview)}...</pre>
                </div>
                
                <div class="numbers-preview">
                    <div class="numbers-header">
                        <strong>Extracted Numbers (${numbers.length}):</strong>
                        <button onclick="pdfProcessor.editNumbers()" class="btn-edit-numbers">✏️ Edit</button>
                    </div>
                    <div class="number-chips-container">
                        ${numbers.slice(0, 30).map(num => `
                            <span class="extracted-chip">${num}</span>
                        `).join('')}
                        ${numbers.length > 30 ? `<span class="more-count">+${numbers.length - 30} more...</span>` : ''}
                    </div>
                </div>
                
                <div class="file-action-buttons">
                    <button onclick="pdfProcessor.useNumbers()" class="btn-use-numbers">
                        ✓ Use These Numbers
                    </button>
                    <button onclick="pdfProcessor.downloadCSV()" class="btn-download-csv">
                        Download CSV
                    </button>
                </div>
            </div>
        `;
    }

    useNumbers() {
        if (!this.extractedNumbers || this.extractedNumbers.length === 0) return;

        const dataInput = document.getElementById('dataInput');
        if (dataInput) {
            dataInput.value = this.extractedNumbers.join(', ');

            // Switch to manual tab
            const manualTab = document.querySelector('[data-tab="manual"]');
            if (manualTab) manualTab.click();

            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`${this.extractedNumbers.length} numbers loaded from ${this.filename}`, 'success');
            }
        }
    }

    editNumbers() {
        const currentNumbers = this.extractedNumbers.join(', ');
        const edited = prompt('Edit numbers (comma-separated):', currentNumbers);

        if (edited !== null) {
            const newNumbers = edited.split(',')
                .map(n => parseFloat(n.trim()))
                .filter(n => !isNaN(n));
            this.extractedNumbers = newNumbers;

            // Get the preview container and re-display
            const container = document.getElementById('pdf-file-preview') ||
                document.getElementById('csv-file-preview');
            if (container) {
                const fileType = this.filename.endsWith('.pdf') ? 'pdf' : 'csv';
                this.displayResults(container, this.filename, newNumbers, '', fileType);
            }
        }
    }

    downloadCSV() {
        if (!this.extractedNumbers || this.extractedNumbers.length === 0) return;

        const csv = this.extractedNumbers.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename.replace(/\.[^/.]+$/, '') + '_extracted.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    clearUpload(fileType) {
        const pdfInput = document.getElementById('pdf-upload');
        const csvInput = document.getElementById('csvFileInput');

        if (fileType === 'pdf') {
            if (pdfInput) pdfInput.value = '';
            const preview = document.getElementById('pdf-file-preview');
            if (preview) preview.innerHTML = '';
        } else {
            if (csvInput) csvInput.value = '';
            const preview = document.getElementById('csv-file-preview') ||
                document.getElementById('fileInfo');
            if (preview) preview.innerHTML = '';
        }

        this.extractedNumbers = null;
        this.filename = null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
let pdfProcessor;
document.addEventListener('DOMContentLoaded', () => {
    pdfProcessor = new PDFProcessor();
});
