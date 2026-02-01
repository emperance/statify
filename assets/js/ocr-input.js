/**
 * OCR Input Handler
 * Uses Tesseract.js for camera/image-based data input
 */

class OCRInputHandler {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.worker = null;
        this.detectedNumbers = [];

        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const startCameraBtn = document.getElementById('start-camera-btn');
        const uploadBtn = document.getElementById('upload-image-btn');
        const imageInput = document.getElementById('image-upload-input');
        const captureBtn = document.getElementById('capture-btn');
        const closeCameraBtn = document.getElementById('close-camera-btn');

        if (startCameraBtn) startCameraBtn.addEventListener('click', () => this.startCamera());
        if (uploadBtn) uploadBtn.addEventListener('click', () => imageInput?.click());
        if (imageInput) imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        if (captureBtn) captureBtn.addEventListener('click', () => this.captureImage());
        if (closeCameraBtn) closeCameraBtn.addEventListener('click', () => this.closeCamera());
    }

    /**
     * Initialize Tesseract worker
     */
    async initializeTesseract() {
        if (this.worker) return this.worker;

        try {
            this.worker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => this.updateProgress(m)
            });

            // Optimize for number recognition
            await this.worker.setParameters({
                tessedit_char_whitelist: '0123456789.,-+ ',
            });

            return this.worker;
        } catch (error) {
            console.error('Failed to initialize Tesseract:', error);
            throw error;
        }
    }

    /**
     * Start camera stream
     */
    async startCamera() {
        // Check for secure context
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            console.error('Camera access requires a secure context (HTTPS)');
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Camera requires HTTPS connection', 'error');
            } else {
                alert('Camera access requires a secure connection (HTTPS).\nPlease use a secure URL (https://).');
            }
            return;
        }

        try {
            this.video = document.getElementById('camera-video');
            this.canvas = document.getElementById('camera-canvas');

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            this.video.srcObject = this.stream;
            document.getElementById('camera-preview').style.display = 'block';

        } catch (error) {
            console.error('Error accessing camera:', error);
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Could not access camera. Try uploading an image instead.', 'error');
            }
        }
    }

    /**
     * Close camera stream
     */
    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        const preview = document.getElementById('camera-preview');
        if (preview) preview.style.display = 'none';
    }

    /**
     * Capture image from camera
     */
    captureImage() {
        if (!this.video || !this.canvas) return;

        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        context.drawImage(this.video, 0, 0);

        const imageData = this.canvas.toDataURL('image/png');

        this.closeCamera();
        this.processImage(imageData);
    }

    /**
     * Handle image upload
     */
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.processImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Process image with OCR
     */
    async processImage(imageData) {
        const processingEl = document.getElementById('ocr-processing');
        const resultEl = document.getElementById('ocr-result');

        if (processingEl) processingEl.style.display = 'block';
        if (resultEl) resultEl.innerHTML = '';

        try {
            await this.initializeTesseract();

            const { data: { text, confidence } } = await this.worker.recognize(imageData);

            this.parseOCRText(text, confidence, imageData);

        } catch (error) {
            console.error('OCR Error:', error);
            if (processingEl) processingEl.style.display = 'none';
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Error reading image. Please try again.', 'error');
            }
        }
    }

    /**
     * Parse OCR text and extract numbers
     */
    parseOCRText(text, confidence, imageData) {
        const processingEl = document.getElementById('ocr-processing');
        if (processingEl) processingEl.style.display = 'none';

        const numbers = this.extractNumbers(text);

        if (numbers.length === 0) {
            this.showNoResults();
            return;
        }

        this.displayOCRResults(numbers, text, confidence, imageData);
    }

    /**
     * Extract numbers from text
     */
    extractNumbers(text) {
        const numbers = [];

        // Clean up text
        let cleanText = text.replace(/[^\d\s.,\-+]/g, ' ');

        // Split by whitespace and newlines
        const parts = cleanText.split(/[\s\n]+/);

        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed) {
                // Handle comma as decimal separator
                const normalized = trimmed.replace(',', '.');
                const num = parseFloat(normalized);

                if (!isNaN(num)) {
                    numbers.push(num);
                }
            }
        });

        return numbers;
    }

    /**
     * Show no results message
     */
    showNoResults() {
        const resultEl = document.getElementById('ocr-result');
        if (!resultEl) return;

        resultEl.innerHTML = `
            <div class="ocr-no-results">
                <span class="ocr-no-results__icon">❌</span>
                <p>No numbers detected in the image.</p>
                <p class="ocr-no-results__hint">Ensure numbers are clearly visible with good lighting.</p>
                <button onclick="ocrHandler.retryCapture()" class="btn-retry">Try Again</button>
            </div>
        `;
    }

    /**
     * Display OCR results
     */
    displayOCRResults(numbers, rawText, confidence, imageData) {
        const resultEl = document.getElementById('ocr-result');
        if (!resultEl) return;

        this.detectedNumbers = numbers;

        const confidencePercent = Math.round(confidence);
        const confidenceClass = confidencePercent > 80 ? 'high' : confidencePercent > 60 ? 'medium' : 'low';

        resultEl.innerHTML = `
            <div class="ocr-success">
                <div class="ocr-header">
                    <h4 class="ocr-header__title">✅ Numbers Detected!</h4>
                    <span class="confidence-badge ${confidenceClass}">
                        ${confidencePercent}% confidence
                    </span>
                </div>
                
                ${imageData ? `<div class="ocr-preview"><img src="${imageData}" alt="Captured image"></div>` : ''}
                
                <div class="ocr-raw-text">
                    <strong>Raw text:</strong>
                    <pre>${rawText || 'N/A'}</pre>
                </div>
                
                <div class="ocr-numbers">
                    <div class="ocr-numbers-header">
                        <strong>Extracted Numbers (${numbers.length}):</strong>
                        <button onclick="ocrHandler.editNumbers()" class="btn-small">✏️ Edit</button>
                    </div>
                    <div class="number-chips">
                        ${numbers.map((num, idx) => `
                            <span class="number-chip" onclick="ocrHandler.removeNumber(${idx})">
                                ${num} <span class="chip-remove">×</span>
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="ocr-actions">
                    <button onclick="ocrHandler.useNumbers()" class="btn-primary">
                        ✓ Use These Numbers
                    </button>
                    <button onclick="ocrHandler.retryCapture()" class="btn-secondary">
                        Scan Again
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Remove a number
     */
    removeNumber(index) {
        this.detectedNumbers.splice(index, 1);
        this.displayOCRResults(this.detectedNumbers, '', 100, '');
    }

    /**
     * Edit numbers manually
     */
    editNumbers() {
        const currentNumbers = this.detectedNumbers.join(', ');
        const edited = prompt('Edit numbers (comma-separated):', currentNumbers);

        if (edited !== null) {
            const newNumbers = edited.split(',')
                .map(n => parseFloat(n.trim()))
                .filter(n => !isNaN(n));
            this.detectedNumbers = newNumbers;
            this.displayOCRResults(newNumbers, '', 100, '');
        }
    }

    /**
     * Use detected numbers in calculator
     */
    useNumbers() {
        if (!this.detectedNumbers || this.detectedNumbers.length === 0) return;

        const dataInput = document.getElementById('dataInput');
        if (dataInput) {
            dataInput.value = this.detectedNumbers.join(', ');

            // Switch to manual tab
            const manualTab = document.querySelector('[data-tab="manual"]');
            if (manualTab) manualTab.click();

            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`${this.detectedNumbers.length} numbers added from OCR!`, 'success');
            }
        }
    }

    /**
     * Retry capture
     */
    retryCapture() {
        const resultEl = document.getElementById('ocr-result');
        if (resultEl) resultEl.innerHTML = '';
        this.detectedNumbers = [];
    }

    /**
     * Update progress indicator
     */
    updateProgress(message) {
        if (message.status === 'recognizing text') {
            const progress = Math.round(message.progress * 100);
            const progressBar = document.getElementById('ocr-progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }
    }
}

// Global instance
let ocrHandler;
document.addEventListener('DOMContentLoaded', () => {
    ocrHandler = new OCRInputHandler();
});
