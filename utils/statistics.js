/**
 * Statistical Calculation Utility
 * Ported from calculate.php to pure JavaScript
 */

class Statistics {
    /**
     * Parse input string or array into array of numbers
     * @param {string|Array} input 
     * @returns {Array<number>}
     */
    static parseInput(input) {
        if (!input) return [];

        let values;
        if (Array.isArray(input)) {
            values = input;
        } else {
            values = input.toString().split(/[,\s;]+/);
        }

        const numbers = [];
        for (let val of values) {
            val = typeof val === 'string' ? val.trim() : val;
            if (val !== '' && !isNaN(val)) {
                numbers.push(Number(val));
            }
        }
        return numbers;
    }

    /**
     * Calculate mean (average)
     * @param {Array<number>} data 
     * @returns {number|null}
     */
    static calculateMean(data) {
        if (!data || data.length === 0) return null;
        const sum = data.reduce((a, b) => a + b, 0);
        return sum / data.length;
    }

    /**
     * Calculate median
     * @param {Array<number>} data 
     * @returns {number|null}
     */
    static calculateMedian(data) {
        if (!data || data.length === 0) return null;

        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * Calculate mode
     * @param {Array<number>} data 
     * @returns {Array<string|number>} array of modes or ['No mode']
     */
    static calculateMode(data) {
        if (!data || data.length === 0) return null;

        const frequency = {};
        let maxFreq = 0;

        for (const val of data) {
            frequency[val] = (frequency[val] || 0) + 1;
            if (frequency[val] > maxFreq) maxFreq = frequency[val];
        }

        if (maxFreq === 1) return ['No mode'];

        const modes = [];
        for (const val in frequency) {
            if (frequency[val] === maxFreq) {
                modes.push(Number(val));
            }
        }

        return modes.sort((a, b) => a - b);
    }

    /**
     * Calculate variance
     * @param {Array<number>} data 
     * @param {boolean} isPopulation 
     * @returns {number|null}
     */
    static calculateVariance(data, isPopulation = false) {
        if (!data || data.length === 0) return null;
        if (!isPopulation && data.length < 2) return null;

        const mean = this.calculateMean(data);
        const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
        const sumSquared = squaredDiffs.reduce((a, b) => a + b, 0);

        const divisor = isPopulation ? data.length : data.length - 1;
        return sumSquared / divisor;
    }

    /**
     * Calculate standard deviation
     * @param {Array<number>} data 
     * @param {boolean} isPopulation 
     * @returns {number|null}
     */
    static calculateStdDev(data, isPopulation = false) {
        const variance = this.calculateVariance(data, isPopulation);
        return variance !== null ? Math.sqrt(variance) : null;
    }

    /**
     * Calculate quartiles
     * @param {Array<number>} data 
     * @returns {Object|null} {q1, q2, q3}
     */
    static calculateQuartiles(data) {
        if (!data || data.length === 0) return null;

        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        const mid = Math.floor(n / 2);

        const q2 = this.calculateMedian(sorted);

        const lowerHalf = sorted.slice(0, mid);
        const q1 = this.calculateMedian(lowerHalf);

        const upperStart = n % 2 === 0 ? mid : mid + 1;
        const upperHalf = sorted.slice(upperStart);
        const q3 = this.calculateMedian(upperHalf);

        return { q1, q2, q3 };
    }

    /**
     * Calculate class width for histogram
     * @param {Array<number>} data 
     * @param {number} numClasses 
     * @returns {number|null}
     */
    static calculateClassWidth(data, numClasses = 5) {
        if (!data || data.length === 0) return null;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        if (!numClasses || numClasses < 1) {
            numClasses = Math.ceil(1 + 3.322 * Math.log10(data.length));
        }

        return Math.ceil((range / numClasses) * 100) / 100;
    }

    /**
     * Format number to specific precision
     * @param {number} num 
     * @param {number} precision 
     * @returns {string|null}
     */
    static formatNumber(num, precision = 4) {
        if (num === null || num === undefined) return null;
        if (Number.isInteger(num)) return num.toString();
        // Avoid scientific notation for simple floats if possible, but use precision
        return Number(num.toFixed(precision)).toString();
    }
}

module.exports = Statistics;
