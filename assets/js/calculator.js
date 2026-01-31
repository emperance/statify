/**
 * Statistical Calculator - Core Calculation Functions
 * Provides pure functions for statistical operations
 */

const StatCalculator = {
    /**
     * Parse input string into array of numbers
     * @param {string} input - Comma, space, or newline separated values
     * @returns {number[]} - Array of valid numbers
     */
    parseInput(input) {
        if (!input || typeof input !== 'string') return [];

        // Split by comma, space, newline, or semicolon
        const values = input
            .split(/[,\s;]+/)
            .map(v => v.trim())
            .filter(v => v !== '')
            .map(v => parseFloat(v))
            .filter(v => !isNaN(v) && isFinite(v));

        return values;
    },

    /**
     * Calculate arithmetic mean (average)
     * @param {number[]} data - Array of numbers
     * @returns {number|null} - Mean value or null if empty
     */
    calculateMean(data) {
        if (!data || data.length === 0) return null;
        const sum = data.reduce((acc, val) => acc + val, 0);
        return sum / data.length;
    },

    /**
     * Calculate median (middle value)
     * @param {number[]} data - Array of numbers
     * @returns {number|null} - Median value or null if empty
     */
    calculateMedian(data) {
        if (!data || data.length === 0) return null;

        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    },

    /**
     * Calculate mode (most frequent value(s))
     * @param {number[]} data - Array of numbers
     * @returns {number[]|null} - Array of mode values or null if empty
     */
    calculateMode(data) {
        if (!data || data.length === 0) return null;

        const frequency = {};
        let maxFreq = 0;

        data.forEach(val => {
            frequency[val] = (frequency[val] || 0) + 1;
            if (frequency[val] > maxFreq) {
                maxFreq = frequency[val];
            }
        });

        // If all values appear once, there's no mode
        if (maxFreq === 1) {
            return ['No mode'];
        }

        const modes = Object.keys(frequency)
            .filter(key => frequency[key] === maxFreq)
            .map(k => parseFloat(k));

        return modes;
    },

    /**
     * Calculate variance
     * @param {number[]} data - Array of numbers
     * @param {boolean} isPopulation - True for population, false for sample
     * @returns {number|null} - Variance or null if empty
     */
    calculateVariance(data, isPopulation = false) {
        if (!data || data.length === 0) return null;
        if (!isPopulation && data.length < 2) return null;

        const mean = this.calculateMean(data);
        const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
        const sumSquaredDiffs = squaredDiffs.reduce((acc, val) => acc + val, 0);

        const divisor = isPopulation ? data.length : data.length - 1;
        return sumSquaredDiffs / divisor;
    },

    /**
     * Calculate standard deviation
     * @param {number[]} data - Array of numbers
     * @param {boolean} isPopulation - True for population, false for sample
     * @returns {number|null} - Standard deviation or null if empty
     */
    calculateStdDev(data, isPopulation = false) {
        const variance = this.calculateVariance(data, isPopulation);
        if (variance === null) return null;
        return Math.sqrt(variance);
    },

    /**
     * Calculate quartiles (Q1, Q2, Q3)
     * @param {number[]} data - Array of numbers
     * @returns {object|null} - Object with q1, q2, q3 or null if empty
     */
    calculateQuartiles(data) {
        if (!data || data.length === 0) return null;

        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;

        // Q2 is the median
        const q2 = this.calculateMedian(sorted);

        // Calculate Q1 (median of lower half)
        const lowerHalf = sorted.slice(0, Math.floor(n / 2));
        const q1 = this.calculateMedian(lowerHalf);

        // Calculate Q3 (median of upper half)
        const upperStart = n % 2 === 0 ? n / 2 : Math.floor(n / 2) + 1;
        const upperHalf = sorted.slice(upperStart);
        const q3 = this.calculateMedian(upperHalf);

        return { q1, q2, q3 };
    },

    /**
     * Calculate Interquartile Range (IQR)
     * @param {number[]} data - Array of numbers
     * @returns {number|null} - IQR or null if empty
     */
    calculateIQR(data) {
        const quartiles = this.calculateQuartiles(data);
        if (!quartiles) return null;
        return quartiles.q3 - quartiles.q1;
    },

    /**
     * Calculate class width for frequency distribution
     * @param {number[]} data - Array of numbers
     * @param {number} numClasses - Number of classes (default: Sturges' formula)
     * @returns {number|null} - Class width or null if empty
     */
    calculateClassWidth(data, numClasses = null) {
        if (!data || data.length === 0) return null;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        // Use Sturges' formula if numClasses not provided
        if (!numClasses || numClasses < 1) {
            numClasses = Math.ceil(1 + 3.322 * Math.log10(data.length));
        }

        // Round up to nice number
        const rawWidth = range / numClasses;
        return Math.ceil(rawWidth * 100) / 100; // Round to 2 decimal places
    },

    /**
     * Get basic statistics (min, max, range, count)
     * @param {number[]} data - Array of numbers
     * @returns {object|null} - Object with min, max, range, count
     */
    getBasicStats(data) {
        if (!data || data.length === 0) return null;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const sum = data.reduce((acc, val) => acc + val, 0);

        return {
            count: data.length,
            sum: sum,
            min: min,
            max: max,
            range: range
        };
    },

    /**
     * Calculate all statistics at once
     * @param {number[]} data - Array of numbers
     * @param {number} numClasses - Number of classes for class width
     * @returns {object} - Object with all calculated statistics
     */
    calculateAll(data, numClasses = 5) {
        if (!data || data.length === 0) {
            return { error: 'No valid data provided' };
        }

        const basic = this.getBasicStats(data);
        const quartiles = this.calculateQuartiles(data);

        return {
            // Basic stats
            count: basic.count,
            sum: this.formatNumber(basic.sum),
            min: this.formatNumber(basic.min),
            max: this.formatNumber(basic.max),
            range: this.formatNumber(basic.range),

            // Central tendency
            mean: this.formatNumber(this.calculateMean(data)),
            median: this.formatNumber(this.calculateMedian(data)),
            mode: this.calculateMode(data),

            // Dispersion
            variancePopulation: this.formatNumber(this.calculateVariance(data, true)),
            varianceSample: this.formatNumber(this.calculateVariance(data, false)),
            stdDevPopulation: this.formatNumber(this.calculateStdDev(data, true)),
            stdDevSample: this.formatNumber(this.calculateStdDev(data, false)),

            // Quartiles
            q1: quartiles ? this.formatNumber(quartiles.q1) : null,
            q2: quartiles ? this.formatNumber(quartiles.q2) : null,
            q3: quartiles ? this.formatNumber(quartiles.q3) : null,
            iqr: this.formatNumber(this.calculateIQR(data)),

            // Class width
            classWidth: this.formatNumber(this.calculateClassWidth(data, numClasses)),
            numClasses: numClasses,

            // Raw data for storage
            rawData: data
        };
    },

    /**
     * Format number to reasonable precision
     * @param {number} num - Number to format
     * @param {number} precision - Decimal places (default: 4)
     * @returns {string|null} - Formatted number or null
     */
    formatNumber(num, precision = 4) {
        if (num === null || num === undefined || isNaN(num)) return null;

        // Check if it's a whole number
        if (Number.isInteger(num)) {
            return num.toString();
        }

        // Round to precision
        const rounded = parseFloat(num.toFixed(precision));
        return rounded.toString();
    },

    /**
     * Validate input data
     * @param {string} input - Raw input string
     * @returns {object} - { valid: boolean, data: number[], error: string }
     */
    validateInput(input) {
        if (!input || input.trim() === '') {
            return { valid: false, data: [], error: 'Please enter some numbers' };
        }

        const data = this.parseInput(input);

        if (data.length === 0) {
            return { valid: false, data: [], error: 'No valid numbers found in input' };
        }

        if (data.length < 2) {
            return { valid: true, data: data, warning: 'Only one value - some statistics require more data' };
        }

        return { valid: true, data: data, error: null };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatCalculator;
}
