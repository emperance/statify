/**
 * AI Insights Display Handler
 * Fetches and renders AI-generated insights for statistical results
 */

const AIInsights = {
    container: null,

    /**
     * Initialize the insights module
     */
    init() {
        this.container = document.getElementById('ai-insights');
    },

    /**
     * Fetch and display AI insights
     */
    async display(statistics, rawData) {
        if (!this.container) {
            this.container = document.getElementById('ai-insights');
        }

        if (!this.container) return;

        this.container.innerHTML = '<div class="ai-loading"><span class="ai-loading-icon"></span> Analyzing your data...</div>';

        try {
            const response = await fetch('/api/generate_insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statistics: statistics,
                    raw_data: rawData
                })
            });

            const data = await response.json();

            if (data.success) {
                this.render(data.insights, data.summary);
            } else {
                this.container.innerHTML = '<div class="ai-error">Unable to generate insights</div>';
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
            // Fallback: generate insights client-side
            this.generateClientSide(statistics, rawData);
        }
    },

    /**
     * Render insights to DOM
     */
    render(insights, summary) {
        let html = `
            <div class="ai-summary">
                <h3 class="ai-summary__title">AI Analysis</h3>
                <p class="ai-summary__text">${summary}</p>
            </div>
            <div class="insights-grid">
        `;

        insights.forEach(insight => {
            if (!insight) return;
            const levelClass = `insight-${insight.level}`;
            html += `
                <div class="insight-card ${levelClass}">
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <h4 class="insight-title">${insight.title}</h4>
                        <p class="insight-desc">${insight.description}</p>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;
    },

    /**
     * Client-side fallback for insights generation
     */
    generateClientSide(stats, rawData) {
        const insights = [];
        const mean = parseFloat(stats.mean);
        const median = parseFloat(stats.median);
        const stdDev = parseFloat(stats.stdDevPopulation || stats.stdDevSample || 0);
        const q1 = parseFloat(stats.q1);
        const q3 = parseFloat(stats.q3);
        const iqr = parseFloat(stats.iqr);
        const count = rawData.length;

        // Distribution analysis
        const diff = Math.abs(mean - median);
        const percentDiff = median !== 0 ? (diff / Math.abs(median)) * 100 : 0;

        if (percentDiff < 5) {
            insights.push({
                type: 'distribution', level: 'positive', icon: '',
                title: 'Symmetrical Distribution',
                description: `Mean (${mean.toFixed(2)}) and median (${median.toFixed(2)}) are very close, indicating balanced data.`
            });
        } else if (mean > median) {
            insights.push({
                type: 'distribution', level: 'info', icon: '',
                title: 'Right-Skewed Distribution',
                description: `Mean (${mean.toFixed(2)}) exceeds median (${median.toFixed(2)}). Some high values pull the average up.`
            });
        } else {
            insights.push({
                type: 'distribution', level: 'info', icon: '',
                title: 'Left-Skewed Distribution',
                description: `Mean (${mean.toFixed(2)}) is below median (${median.toFixed(2)}). Some low values pull the average down.`
            });
        }

        // Outlier detection
        const lowerFence = q1 - (1.5 * iqr);
        const upperFence = q3 + (1.5 * iqr);
        const outliers = rawData.filter(v => v < lowerFence || v > upperFence);

        if (outliers.length === 0) {
            insights.push({
                type: 'outliers', level: 'positive', icon: '✅',
                title: 'No Outliers Detected',
                description: `All values fall within normal range (${lowerFence.toFixed(2)} to ${upperFence.toFixed(2)}).`
            });
        } else {
            insights.push({
                type: 'outliers', level: 'warning', icon: '',
                title: `${outliers.length} Outlier(s) Detected`,
                description: `Values [${outliers.map(v => v.toFixed(2)).join(', ')}] are outside expected range.`
            });
        }

        // Sample size
        if (count < 30) {
            insights.push({
                type: 'quality', level: 'info', icon: 'ℹ️',
                title: 'Sample Size Note',
                description: `${count} data points. Consider 30+ samples for more robust statistics.`
            });
        }

        const summary = `Analysis of ${count} values ranging from ${Math.min(...rawData).toFixed(2)} to ${Math.max(...rawData).toFixed(2)}. Average: ${mean.toFixed(2)}, typical value: ${median.toFixed(2)}.`;

        this.render(insights, summary);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => AIInsights.init());
