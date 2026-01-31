/**
 * Voice Input Handler
 * Uses Web Speech API for voice-based data input
 */

class VoiceInputHandler {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.numbers = [];
        this.currentLanguage = 'en-US'; // Default language

        this.initializeRecognition();
        this.attachEventListeners();
    }

    /**
     * Initialize Web Speech API
     */
    initializeRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Voice input not supported in this browser');
            this.showUnsupportedMessage();
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;

        this.recognition.onstart = () => this.onStart();
        this.recognition.onresult = (event) => this.onResult(event);
        this.recognition.onerror = (event) => this.onError(event);
        this.recognition.onend = () => this.onEnd();
    }

    /**
     * Set recognition language
     * @param {string} lang - Language code ('en-US' or 'id-ID')
     */
    setLanguage(lang) {
        this.currentLanguage = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }

        // Update UI to reflect current language
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        console.log('Voice recognition language set to:', lang);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const startBtn = document.getElementById('start-voice-btn');
        const stopBtn = document.getElementById('stop-voice-btn');
        const clearBtn = document.getElementById('clear-voice-btn');
        const useBtn = document.getElementById('use-voice-btn');

        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clear());
        if (useBtn) useBtn.addEventListener('click', () => this.useNumbers());

        // Language selector buttons
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setLanguage(btn.dataset.lang);
            });
        });
    }

    /**
     * Show unsupported message
     */
    showUnsupportedMessage() {
        const section = document.getElementById('voice-input-section');
        if (section) {
            section.innerHTML = `
                <div class="voice-unsupported">
                    <span class="voice-unsupported__icon"></span>
                    <p>Voice input is not supported in your browser.</p>
                    <p>Please use Chrome, Edge, or Safari.</p>
                </div>
            `;
        }
    }

    /**
     * Start listening
     */
    start() {
        if (!this.recognition) {
            alert('Voice recognition not available');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    /**
     * Stop listening
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Clear all data
     */
    clear() {
        this.transcript = '';
        this.numbers = [];

        const transcriptEl = document.getElementById('voice-transcript');
        const previewEl = document.getElementById('voice-data-preview');

        if (transcriptEl) transcriptEl.textContent = 'Your spoken numbers will appear here...';
        if (previewEl) previewEl.innerHTML = '';
    }

    /**
     * Handle recognition start
     */
    onStart() {
        this.isListening = true;

        const indicator = document.getElementById('listening-indicator');
        const startBtn = document.getElementById('start-voice-btn');
        const stopBtn = document.getElementById('stop-voice-btn');

        if (indicator) indicator.style.display = 'flex';
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.classList.add('listening');
        }
        if (stopBtn) stopBtn.disabled = false;
    }

    /**
     * Handle recognition result
     */
    onResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        // Update display
        const transcriptDiv = document.getElementById('voice-transcript');
        if (transcriptDiv) {
            this.transcript += finalTranscript;
            transcriptDiv.innerHTML = this.transcript +
                '<span class="voice-interim">' + interimTranscript + '</span>';
        }

        // Parse numbers from final transcript
        if (finalTranscript) {
            this.parseNumbers(finalTranscript);
        }

        // Check for voice commands
        this.checkCommands(finalTranscript.toLowerCase());
    }

    /**
     * Parse numbers from spoken text
     */
    parseNumbers(text) {
        const cleanText = this.convertWordsToNumbers(text);
        const numberPattern = /-?\d+\.?\d*/g;
        const foundNumbers = cleanText.match(numberPattern);

        if (foundNumbers) {
            foundNumbers.forEach(num => {
                const number = parseFloat(num);
                if (!isNaN(number)) {
                    this.numbers.push(number);
                }
            });

            this.updateDataPreview();
        }
    }

    /**
     * Convert spoken number words to digits (supports English and Indonesian)
     */
    convertWordsToNumbers(text) {
        // English number words
        const englishNumbers = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
            'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
            'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
            'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
            'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
        };

        // Indonesian number words
        const indonesianNumbers = {
            'nol': '0', 'kosong': '0', 'satu': '1', 'dua': '2', 'tiga': '3', 'empat': '4',
            'lima': '5', 'enam': '6', 'tujuh': '7', 'delapan': '8', 'sembilan': '9',
            'sepuluh': '10', 'sebelas': '11', 'duabelas': '12', 'tigabelas': '13',
            'empatbelas': '14', 'limabelas': '15', 'enambelas': '16', 'tujuhbelas': '17',
            'delapanbelas': '18', 'sembilanbelas': '19', 'duapuluh': '20', 'tigapuluh': '30',
            'empatpuluh': '40', 'limapuluh': '50', 'enampuluh': '60', 'tujuhpuluh': '70',
            'delapanpuluh': '80', 'sembilanpuluh': '90', 'seratus': '100', 'seribu': '1000',
            'ratus': '100', 'ribu': '1000', 'puluh': '0'
        };

        // Combine both dictionaries
        const numberWords = { ...englishNumbers, ...indonesianNumbers };

        let result = text.toLowerCase();

        for (const [word, digit] of Object.entries(numberWords)) {
            const regex = new RegExp('\\b' + word + '\\b', 'gi');
            result = result.replace(regex, digit);
        }

        // Handle "point" for decimals (English)
        result = result.replace(/\bpoint\b/gi, '.');

        // Handle "koma" for decimals (Indonesian)
        result = result.replace(/\bkoma\b/gi, '.');

        return result;
    }

    /**
     * Update the data preview display
     */
    updateDataPreview() {
        const preview = document.getElementById('voice-data-preview');
        if (!preview) return;

        if (this.numbers.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = `
            <div class="voice-preview-header">
                <strong>Detected Numbers (${this.numbers.length}):</strong>
            </div>
            <div class="number-chips">
                ${this.numbers.map((num, idx) => `
                    <span class="number-chip" onclick="voiceHandler.removeNumber(${idx})">
                        ${num} <span class="chip-remove">×</span>
                    </span>
                `).join('')}
            </div>
        `;
    }

    /**
     * Remove a number by index
     */
    removeNumber(index) {
        this.numbers.splice(index, 1);
        this.updateDataPreview();
    }

    /**
     * Check for voice commands (supports English and Indonesian)
     */
    checkCommands(text) {
        // English commands
        if (text.includes('calculate') || text.includes('compute') || text.includes('done')) {
            this.stop();
            if (this.numbers.length > 0) {
                this.useNumbers();
            }
        } else if (text.includes('clear') || text.includes('reset')) {
            this.clear();
        }

        // Indonesian commands
        if (text.includes('hitung') || text.includes('selesai')) {
            this.stop();
            if (this.numbers.length > 0) {
                this.useNumbers();
            }
        } else if (text.includes('hapus') || text.includes('bersihkan')) {
            this.clear();
        }
    }

    /**
     * Use the detected numbers in the calculator
     */
    useNumbers() {
        if (this.numbers.length === 0) return;

        const dataInput = document.getElementById('dataInput');
        if (dataInput) {
            dataInput.value = this.numbers.join(', ');

            // Switch to manual tab to show data
            const manualTab = document.querySelector('[data-tab="manual"]');
            if (manualTab) manualTab.click();

            // Show notification
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`${this.numbers.length} numbers added from voice input!`, 'success');
            }
        }
    }

    /**
     * Handle recognition errors
     */
    onError(event) {
        console.error('Voice recognition error:', event.error);

        let message = 'Voice input error: ';
        switch (event.error) {
            case 'no-speech':
                message += 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                message += 'Microphone not found.';
                break;
            case 'not-allowed':
                message += 'Microphone permission denied.';
                break;
            default:
                message += event.error;
        }

        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(message, 'error');
        }

        this.isListening = false;
    }

    /**
     * Handle recognition end
     */
    onEnd() {
        this.isListening = false;

        const indicator = document.getElementById('listening-indicator');
        const startBtn = document.getElementById('start-voice-btn');
        const stopBtn = document.getElementById('stop-voice-btn');

        if (indicator) indicator.style.display = 'none';
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.classList.remove('listening');
        }
        if (stopBtn) stopBtn.disabled = true;
    }

    /**
     * Get collected numbers
     */
    getNumbers() {
        return this.numbers;
    }
}

// Global instance
let voiceHandler;
document.addEventListener('DOMContentLoaded', () => {
    voiceHandler = new VoiceInputHandler();
});
