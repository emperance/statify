/**
 * AI Data Extractor
 * Extracts numbers from natural language text using Groq AI
 */

const AIDataExtractor = {
    extractedNumbers: [],
    lastResult: null,

    /**
     * Initialize the extractor
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        const extractBtn = document.getElementById('ai-extract-btn');
        const useExtractedBtn = document.getElementById('use-extracted-btn');
        const clearExtractBtn = document.getElementById('clear-extract-btn');
        const textInput = document.getElementById('ai-text-input');

        if (extractBtn) {
            extractBtn.addEventListener('click', () => this.extractNumbers());
        }

        if (useExtractedBtn) {
            useExtractedBtn.addEventListener('click', () => this.useExtractedNumbers());
        }

        if (clearExtractBtn) {
            clearExtractBtn.addEventListener('click', () => this.clearExtraction());
        }

        // Also extract on Enter key (Shift+Enter for newline)
        if (textInput) {
            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.extractNumbers();
                }
            });
        }
    },

    /**
     * Extract numbers from the text input
     */
    async extractNumbers() {
        const textInput = document.getElementById('ai-text-input');
        const resultContainer = document.getElementById('ai-extraction-result');
        const extractBtn = document.getElementById('ai-extract-btn');
        const useExtractedBtn = document.getElementById('use-extracted-btn');

        if (!textInput || !resultContainer) return;

        const text = textInput.value.trim();
        if (!text) {
            this.showError('Please enter some text to extract numbers from.');
            return;
        }

        // Get options
        const categorize = document.getElementById('ai-categorize')?.checked ?? false;
        const removeDuplicates = document.getElementById('ai-remove-duplicates')?.checked ?? false;

        // Show loading state
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<span class="spinner"></span> Extracting...';
        resultContainer.innerHTML = '<div class="ai-loading"><span class="ai-loading-icon"></span> AI is analyzing your text...</div>';
        resultContainer.style.display = 'block';

        try {
            const response = await fetch('api/ai_extract_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    categorize: categorize,
                    removeDuplicates: removeDuplicates
                })
            });

            const data = await response.json();

            if (data.success && data.numbers && data.numbers.length > 0) {
                this.extractedNumbers = data.numbers;
                this.lastResult = data;
                this.displayResult(data);
                if (useExtractedBtn) useExtractedBtn.style.display = 'inline-flex';
            } else if (data.numbers && data.numbers.length === 0) {
                this.showError('No numbers found in the text. Try a different input.');
            } else {
                this.showError(data.error || 'Failed to extract numbers.');
            }
        } catch (error) {
            console.error('AI extraction error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            extractBtn.disabled = false;
            extractBtn.innerHTML = 'Extract Numbers';
        }
    },

    /**
     * Display extraction result
     */
    displayResult(data) {
        const resultContainer = document.getElementById('ai-extraction-result');
        if (!resultContainer) return;

        const numbersStr = data.numbers.join(', ');
        const fallbackNote = data.fallback ? '<span class="ai-fallback-note">(using pattern matching)</span>' : '<span class="ai-powered-note">AI-powered</span>';

        let html = `
            <div class="extraction-success">
                <div class="extraction-header">
                    <span class="extraction-icon">✅</span>
                    <span>Found ${data.numbers.length} number${data.numbers.length !== 1 ? 's' : ''}</span>
                    ${fallbackNote}
                </div>
                <div class="extracted-numbers">
                    <code>${numbersStr}</code>
                </div>
        `;

        if (data.explanation) {
            html += `<div class="extraction-explanation"><strong>Context:</strong> ${data.explanation}</div>`;
        }

        // Show categories if available
        if (data.categorized && Object.keys(data.categorized).length > 0) {
            html += '<div class="extraction-categories"><strong>Categories:</strong><ul>';
            for (const [category, nums] of Object.entries(data.categorized)) {
                if (Array.isArray(nums) && nums.length > 0) {
                    html += `<li><em>${category}:</em> ${nums.join(', ')}</li>`;
                }
            }
            html += '</ul></div>';
        }

        html += '</div>';
        resultContainer.innerHTML = html;
    },

    /**
     * Show error message
     */
    showError(message) {
        const resultContainer = document.getElementById('ai-extraction-result');
        if (resultContainer) {
            resultContainer.innerHTML = `<div class="extraction-error"><span>⚠️</span> ${message}</div>`;
            resultContainer.style.display = 'block';
        }
    },

    /**
     * Use extracted numbers in the main calculator
     */
    useExtractedNumbers() {
        if (this.extractedNumbers.length === 0) return;

        const dataInput = document.getElementById('dataInput');
        const manualTab = document.querySelector('[data-tab="manual"]');

        if (dataInput) {
            dataInput.value = this.extractedNumbers.join(', ');
            // Trigger input event for validation
            dataInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Switch to manual tab
        if (manualTab) {
            manualTab.click();
        }

        // Show success notification
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(`${this.extractedNumbers.length} numbers loaded into calculator`, 'success');
        }
    },

    /**
     * Clear extraction
     */
    clearExtraction() {
        this.extractedNumbers = [];
        this.lastResult = null;

        const textInput = document.getElementById('ai-text-input');
        const resultContainer = document.getElementById('ai-extraction-result');
        const useExtractedBtn = document.getElementById('use-extracted-btn');

        if (textInput) textInput.value = '';
        if (resultContainer) {
            resultContainer.innerHTML = '';
            resultContainer.style.display = 'none';
        }
        if (useExtractedBtn) useExtractedBtn.style.display = 'none';
    },

    /**
     * Get currently extracted numbers
     */
    getNumbers() {
        return this.extractedNumbers;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => AIDataExtractor.init());
