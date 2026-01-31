/**
 * Theme Manager
 * Handles theme switching, persistence, and custom theme creation
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // Default to dark (matches existing glassmorphism)
        this.customThemes = {};
        this.init();
    }

    init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && (THEMES[savedTheme] || this.customThemes[savedTheme])) {
            this.applyTheme(savedTheme);
        } else {
            // Default theme
            this.applyTheme('dark');
        }

        // Load custom themes
        const customThemes = localStorage.getItem('customThemes');
        if (customThemes) {
            try {
                this.customThemes = JSON.parse(customThemes);
            } catch (e) {
                console.error('Error loading custom themes:', e);
            }
        }

        this.renderThemeSelector();
        this.attachEventListeners();
    }

    applyTheme(themeName) {
        const theme = THEMES[themeName] || this.customThemes[themeName];

        if (!theme) {
            console.error('Theme not found:', themeName);
            return;
        }

        // Apply CSS custom properties
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Update body class for theme-specific styles
        document.body.className = document.body.className.replace(/theme-\S+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        this.currentTheme = themeName;
        localStorage.setItem('selectedTheme', themeName);

        this.updateThemeSelector();

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, colors: theme.colors }
        }));
    }

    renderThemeSelector() {
        const container = document.getElementById('theme-selector-container');
        if (!container) return;

        const currentThemeData = THEMES[this.currentTheme] || this.customThemes[this.currentTheme];

        container.innerHTML = `
            <div class="theme-selector">
                <button class="theme-toggle-btn" id="theme-toggle-btn" title="Change Theme">
                    <span class="theme-icon">${currentThemeData?.icon || ''}</span>
                    <span class="theme-text">${currentThemeData?.name || 'Theme'}</span>
                    <span class="theme-arrow">▼</span>
                </button>
                
                <div class="theme-dropdown" id="theme-dropdown">
                    <div class="theme-dropdown-header">
                        <h3>Choose Theme</h3>
                        <button class="close-dropdown" id="close-theme-dropdown">✕</button>
                    </div>
                    
                    <div class="theme-grid">
                        ${this.renderThemeOptions()}
                    </div>
                    
                    <div class="theme-actions">
                        <button class="btn-create-theme" id="create-custom-theme">
                            ➕ Create Custom Theme
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderThemeOptions() {
        let html = '';

        // Built-in themes
        Object.entries(THEMES).forEach(([key, theme]) => {
            const isActive = this.currentTheme === key;
            html += `
                <button class="theme-option ${isActive ? 'active' : ''}" data-theme="${key}">
                    <span class="theme-option-icon">${theme.icon}</span>
                    <span class="theme-option-name">${theme.name}</span>
                    ${isActive ? '<span class="check-mark">✓</span>' : ''}
                </button>
            `;
        });

        // Custom themes
        Object.entries(this.customThemes).forEach(([key, theme]) => {
            const isActive = this.currentTheme === key;
            html += `
                <button class="theme-option custom-theme ${isActive ? 'active' : ''}" data-theme="${key}">
                    <span class="theme-option-icon"></span>
                    <span class="theme-option-name">${theme.name}</span>
                    <button class="delete-custom-theme" data-theme="${key}">✕</button>
                    ${isActive ? '<span class="check-mark">✓</span>' : ''}
                </button>
            `;
        });

        return html;
    }

    attachEventListeners() {
        // Toggle dropdown
        document.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('#theme-toggle-btn');
            const dropdown = document.getElementById('theme-dropdown');

            if (toggleBtn && dropdown) {
                dropdown.classList.toggle('show');
                return;
            }

            // Close dropdown
            if (e.target.closest('#close-theme-dropdown')) {
                dropdown?.classList.remove('show');
                return;
            }

            // Theme option click
            if (e.target.closest('.theme-option') && !e.target.closest('.delete-custom-theme')) {
                const themeName = e.target.closest('.theme-option').dataset.theme;
                this.applyTheme(themeName);
                dropdown?.classList.remove('show');
                return;
            }

            // Delete custom theme
            if (e.target.closest('.delete-custom-theme')) {
                e.stopPropagation();
                const themeName = e.target.closest('.delete-custom-theme').dataset.theme;
                this.deleteCustomTheme(themeName);
                return;
            }

            // Create custom theme
            if (e.target.closest('#create-custom-theme')) {
                this.openCustomThemeCreator();
                dropdown?.classList.remove('show');
                return;
            }

            // Close on outside click
            if (!e.target.closest('.theme-selector')) {
                dropdown?.classList.remove('show');
            }
        });
    }

    updateThemeSelector() {
        this.renderThemeSelector();
    }

    openCustomThemeCreator() {
        const modal = document.createElement('div');
        modal.className = 'theme-creator-modal';
        modal.innerHTML = `
            <div class="theme-creator-content">
                <div class="theme-creator-header">
                    <h2>Create Custom Theme</h2>
                    <button class="close-modal" id="close-theme-creator">✕</button>
                </div>
                
                <div class="theme-creator-body">
                    <div class="form-group">
                        <label>Theme Name:</label>
                        <input type="text" id="custom-theme-name" placeholder="My Awesome Theme">
                    </div>
                    
                    <div class="color-picker-grid">
                        <div class="color-picker-item">
                            <label>Primary Color:</label>
                            <input type="color" id="color-primary" value="#667eea">
                        </div>
                        <div class="color-picker-item">
                            <label>Background:</label>
                            <input type="color" id="color-bg-primary" value="#1a1a2e">
                        </div>
                        <div class="color-picker-item">
                            <label>Text Color:</label>
                            <input type="color" id="color-text-primary" value="#f0f6fc">
                        </div>
                        <div class="color-picker-item">
                            <label>Success:</label>
                            <input type="color" id="color-success" value="#28a745">
                        </div>
                        <div class="color-picker-item">
                            <label>Warning:</label>
                            <input type="color" id="color-warning" value="#ffc107">
                        </div>
                        <div class="color-picker-item">
                            <label>Gradient End:</label>
                            <input type="color" id="color-gradient-end" value="#764ba2">
                        </div>
                    </div>
                    
                    <div class="theme-preview">
                        <h4>Preview:</h4>
                        <div class="preview-card" id="theme-preview-card">
                            <h5>Sample Card</h5>
                            <p>This is how your theme will look.</p>
                            <button class="preview-btn">Button</button>
                        </div>
                    </div>
                </div>
                
                <div class="theme-creator-footer">
                    <button class="btn-cancel" id="cancel-theme-creator">Cancel</button>
                    <button class="btn-save" id="save-custom-theme">Save Theme</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#close-theme-creator').onclick = () => modal.remove();
        modal.querySelector('#cancel-theme-creator').onclick = () => modal.remove();
        modal.querySelector('#save-custom-theme').onclick = () => this.saveCustomTheme(modal);

        // Live preview
        modal.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', () => this.updateThemePreview(modal));
        });

        this.updateThemePreview(modal);
    }

    updateThemePreview(modal) {
        const previewCard = modal.querySelector('#theme-preview-card');
        const primary = modal.querySelector('#color-primary').value;
        const bg = modal.querySelector('#color-bg-primary').value;
        const text = modal.querySelector('#color-text-primary').value;

        previewCard.style.backgroundColor = bg;
        previewCard.style.color = text;
        previewCard.style.border = `1px solid ${primary}`;
        previewCard.querySelector('.preview-btn').style.background =
            `linear-gradient(135deg, ${primary}, ${modal.querySelector('#color-gradient-end').value})`;
    }

    saveCustomTheme(modal) {
        const name = modal.querySelector('#custom-theme-name').value.trim();

        if (!name) {
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Please enter a theme name', 'error');
            } else {
                alert('Please enter a theme name');
            }
            return;
        }

        const themeKey = 'custom-' + name.toLowerCase().replace(/\s+/g, '-');
        const primary = modal.querySelector('#color-primary').value;
        const bg = modal.querySelector('#color-bg-primary').value;
        const text = modal.querySelector('#color-text-primary').value;
        const secondary = modal.querySelector('#color-gradient-end').value;

        const customTheme = {
            name: name,
            icon: '',
            colors: {
                '--primary-color': primary,
                '--primary-color-rgb': this.hexToRgb(primary),
                '--secondary-color': secondary,
                '--success-color': modal.querySelector('#color-success').value,
                '--warning-color': modal.querySelector('#color-warning').value,
                '--danger-color': '#dc3545',
                '--info-color': '#17a2b8',

                '--bg-primary': bg,
                '--bg-secondary': this.adjustBrightness(bg, 10),
                '--bg-tertiary': this.adjustBrightness(bg, 20),
                '--bg-glass': this.hexToRgba(bg, 0.7),

                '--text-primary': text,
                '--text-secondary': this.adjustBrightness(text, 30),
                '--text-tertiary': this.adjustBrightness(text, 50),

                '--border-color': this.hexToRgba(text, 0.15),
                '--shadow-color': this.hexToRgba(primary, 0.2),

                '--card-bg': this.hexToRgba(bg, 0.8),
                '--input-bg': this.hexToRgba(this.adjustBrightness(bg, 10), 0.9),

                '--gradient-start': primary,
                '--gradient-end': secondary,

                '--chart-grid': this.adjustBrightness(bg, 15),
                // Chart colors for market tracker - use success color for positive
                '--chart-positive': modal.querySelector('#color-success').value,
                '--chart-positive-bg': this.hexToRgba(modal.querySelector('#color-success').value, 0.2),
                '--chart-negative': '#dc3545',
                '--chart-negative-bg': 'rgba(220, 53, 69, 0.2)',
                '--chart-neutral': this.adjustBrightness(text, 30),
                '--chart-neutral-bg': this.hexToRgba(text, 0.15),

                // Legacy Mappings
                '--glass-bg': this.hexToRgba(this.adjustBrightness(bg, 5), 0.8),
                '--glass-bg-hover': this.hexToRgba(this.adjustBrightness(bg, 10), 0.9),
                '--glass-border': this.hexToRgba(text, 0.15),
                '--glass-shadow': this.hexToRgba(primary, 0.2),
                '--text-muted': this.adjustBrightness(text, 40),
                '--accent-gold': primary,
                '--accent-gold-light': this.adjustBrightness(primary, 20),
                '--accent-rose': secondary,
                '--accent-pink': '#d63384'
            }
        };

        this.customThemes[themeKey] = customTheme;
        localStorage.setItem('customThemes', JSON.stringify(this.customThemes));

        this.applyTheme(themeKey);
        modal.remove();

        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Custom theme created!', 'success');
        }
    }

    deleteCustomTheme(themeName) {
        if (confirm('Delete this custom theme?')) {
            delete this.customThemes[themeName];
            localStorage.setItem('customThemes', JSON.stringify(this.customThemes));

            if (this.currentTheme === themeName) {
                this.applyTheme('dark');
            }

            this.updateThemeSelector();
        }
    }

    // Utility functions
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '0, 0, 0';
    }

    hexToRgba(hex, alpha) {
        return `rgba(${this.hexToRgb(hex)}, ${alpha})`;
    }

    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize
let themeManager;
document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
});
