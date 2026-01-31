/**
 * Statistical Calculator - Chart Rendering
 * Uses Chart.js to create visualizations
 */

const ChartManager = {
    charts: {
        boxPlot: null,
        histogram: null
    },

    // Current data state
    currentStats: null,
    currentData: null,

    // Sample datasets
    sampleData: {
        'test-scores': [72, 85, 90, 68, 75, 82, 78, 95, 88, 92, 70, 85, 80, 77, 94, 65, 89, 73, 81, 87, 76, 83, 91, 69, 84],
        'heights': [165, 172, 168, 175, 180, 162, 170, 178, 169, 173, 167, 174, 171, 176, 163, 179, 166, 177, 164, 181],
        'temperatures': [22, 25, 28, 30, 27, 24, 26, 29, 31, 23, 25, 28, 32, 29, 26, 24, 27, 30, 28, 25, 23, 26, 29, 31, 27, 24, 28, 30, 26, 25],
        'sales': [15000, 18500, 22000, 19500, 21000, 25000, 23500, 20000, 17500, 24000, 26500, 28000, 22500, 19000, 27000]
    },

    /**
     * Get chart colors from CSS variables
     */
    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        return {
            textPrimary: style.getPropertyValue('--text-primary').trim() || '#ffffff',
            textSecondary: style.getPropertyValue('--text-secondary').trim() || 'rgba(255, 255, 255, 0.7)',
            gridColor: style.getPropertyValue('--chart-grid').trim() || 'rgba(255, 255, 255, 0.1)',
            primaryColor: style.getPropertyValue('--primary-color').trim() || '#667eea',
            secondaryColor: style.getPropertyValue('--secondary-color').trim() || '#764ba2',
            bgPrimary: style.getPropertyValue('--bg-primary').trim() || '#1a1a2e'
        };
    },

    /**
     * Create a box plot visualization
     * @param {object} stats - Statistics object with q1, q2, q3, min, max
     */
    createBoxPlot(stats) {
        const ctx = document.getElementById('boxPlotChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.boxPlot) {
            this.charts.boxPlot.destroy();
        }

        const colors = this.getThemeColors();
        const min = parseFloat(stats.min);
        const max = parseFloat(stats.max);
        const q1 = parseFloat(stats.q1);
        const q2 = parseFloat(stats.q2);
        const q3 = parseFloat(stats.q3);

        // Create a pseudo box plot using bar chart
        this.charts.boxPlot = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Distribution'],
                datasets: [
                    {
                        label: 'Min to Q1',
                        data: [q1 - min],
                        backgroundColor: this.hexToRgba(colors.primaryColor, 0.3),
                        borderColor: colors.primaryColor,
                        borderWidth: 1
                    },
                    {
                        label: 'Q1 to Median',
                        data: [q2 - q1],
                        backgroundColor: this.hexToRgba(colors.primaryColor, 0.6),
                        borderColor: colors.primaryColor,
                        borderWidth: 2
                    },
                    {
                        label: 'Median to Q3',
                        data: [q3 - q2],
                        backgroundColor: this.hexToRgba(colors.secondaryColor, 0.6),
                        borderColor: colors.secondaryColor,
                        borderWidth: 2
                    },
                    {
                        label: 'Q3 to Max',
                        data: [max - q3],
                        backgroundColor: this.hexToRgba(colors.secondaryColor, 0.3),
                        borderColor: colors.secondaryColor,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            color: colors.gridColor
                        },
                        ticks: {
                            color: colors.textSecondary
                        },
                        title: {
                            display: true,
                            text: 'Values',
                            color: colors.textPrimary
                        }
                    },
                    y: {
                        stacked: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: colors.textSecondary
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: colors.textSecondary,
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: function () {
                                return [
                                    `Min: ${min.toFixed(2)}`,
                                    `Q1: ${q1.toFixed(2)}`,
                                    `Median: ${q2.toFixed(2)}`,
                                    `Q3: ${q3.toFixed(2)}`,
                                    `Max: ${max.toFixed(2)}`
                                ];
                            }
                        },
                        backgroundColor: colors.bgPrimary,
                        titleColor: colors.textPrimary,
                        bodyColor: colors.textSecondary,
                        borderColor: colors.gridColor,
                        borderWidth: 1
                    }
                }
            }
        });
    },

    /**
     * Create a histogram visualization
     * @param {number[]} data - Array of numeric data
     * @param {number} numBins - Number of histogram bins
     */
    createHistogram(data, numBins = 8) {
        const ctx = document.getElementById('histogramChart');
        if (!ctx || !data || data.length === 0) return;

        // Destroy existing chart
        if (this.charts.histogram) {
            this.charts.histogram.destroy();
        }

        const colors = this.getThemeColors();

        // Create histogram bins
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / numBins;

        const bins = [];
        const labels = [];

        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binWidth);
            const binEnd = binStart + binWidth;
            bins.push(0);
            labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
        }

        // Count values in each bin
        data.forEach(value => {
            let binIndex = Math.floor((value - min) / binWidth);
            if (binIndex >= numBins) binIndex = numBins - 1;
            if (binIndex < 0) binIndex = 0;
            bins[binIndex]++;
        });

        this.charts.histogram = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: bins,
                    backgroundColor: this.hexToRgba(colors.primaryColor, 0.6),
                    borderColor: colors.primaryColor,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: {
                            color: colors.gridColor
                        },
                        ticks: {
                            color: colors.textSecondary,
                            maxRotation: 45,
                            font: { size: 9 }
                        },
                        title: {
                            display: true,
                            text: 'Value Range',
                            color: colors.textPrimary
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: colors.gridColor
                        },
                        ticks: {
                            color: colors.textSecondary,
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Frequency',
                            color: colors.textPrimary
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: colors.bgPrimary,
                        titleColor: colors.textPrimary,
                        bodyColor: colors.textSecondary,
                        borderColor: colors.gridColor,
                        borderWidth: 1
                    }
                }
            }
        });
    },

    /**
     * Update all charts with new data
     * @param {object} stats - Statistics object
     * @param {number[]} rawData - Raw data array
     */
    updateCharts(stats, rawData) {
        this.currentStats = stats;
        this.currentData = rawData;
        this.createBoxPlot(stats);
        this.createHistogram(rawData, parseInt(stats.numClasses) || 8);
    },

    /**
     * Update charts theme without changing data
     */
    updateTheme() {
        if (this.currentStats && this.currentData) {
            this.updateCharts(this.currentStats, this.currentData);
        }
    },

    /**
     * Destroy all charts
     */
    destroyCharts() {
        if (this.charts.boxPlot) {
            this.charts.boxPlot.destroy();
            this.charts.boxPlot = null;
        }
        if (this.charts.histogram) {
            this.charts.histogram.destroy();
            this.charts.histogram = null;
        }
        this.currentStats = null;
        this.currentData = null;
    },

    /**
     * Get sample data by key
     * @param {string} key - Sample data key
     * @returns {number[]} - Sample data array
     */
    getSampleData(key) {
        return this.sampleData[key] || [];
    },

    /**
     * Helper to convert hex to rgba
     */
    hexToRgba(hex, alpha) {
        // If it's already an rgb/rgba string, just return it (or simplistic handling)
        if (hex.startsWith('rgb')) return hex;

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` :
            hex;
    }
};

// Listen for theme changes
document.addEventListener('themeChanged', () => {
    ChartManager.updateTheme();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
