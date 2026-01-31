/**
 * Theme Configuration
 * Defines all built-in themes for the statistics calculator
 * UPDATED: Includes legacy variable mappings for compatibility with style.css
 */

const THEMES = {
    light: {
        name: 'Light',
        icon: '☀️',
        colors: {
            // New Theme Variables
            '--primary-color': '#667eea',
            '--primary-color-rgb': '102, 126, 234',
            '--secondary-color': '#764ba2',
            '--success-color': '#28a745',
            '--warning-color': '#ffc107',
            '--danger-color': '#dc3545',
            '--info-color': '#17a2b8',

            '--bg-primary': '#f8f9fa',
            '--bg-secondary': '#ffffff',
            '--bg-tertiary': '#e9ecef',
            '--bg-glass': 'rgba(255, 255, 255, 0.7)',

            '--text-primary': '#212529',
            '--text-secondary': '#495057',
            '--text-tertiary': '#6c757d',

            '--border-color': 'rgba(0, 0, 0, 0.1)',
            '--shadow-color': 'rgba(0, 0, 0, 0.1)',

            '--card-bg': 'rgba(255, 255, 255, 0.8)',
            '--input-bg': '#ffffff',

            '--gradient-start': '#667eea',
            '--gradient-end': '#764ba2',

            '--chart-grid': '#e9ecef',
            '--chart-positive': '#2e7d32',
            '--chart-positive-bg': 'rgba(46, 125, 50, 0.15)',
            '--chart-negative': '#c62828',
            '--chart-negative-bg': 'rgba(198, 40, 40, 0.15)',
            '--chart-neutral': '#757575',
            '--chart-neutral-bg': 'rgba(117, 117, 117, 0.15)',

            // Legacy Mappings for style.css
            '--glass-bg': 'rgba(255, 255, 255, 0.8)',
            '--glass-bg-hover': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': 'rgba(0, 0, 0, 0.1)',
            '--glass-shadow': 'rgba(0, 0, 0, 0.1)',
            '--text-muted': '#6c757d',
            '--accent-gold': '#667eea',
            '--accent-gold-light': '#764ba2',
            '--accent-rose': '#764ba2',
            '--accent-pink': '#d63384'
        }
    },

    dark: {
        name: 'Dark',
        icon: '🌙',
        colors: {
            '--primary-color': '#4dabf7',
            '--primary-color-rgb': '77, 171, 247',
            '--secondary-color': '#9775fa',
            '--success-color': '#51cf66',
            '--warning-color': '#ffd43b',
            '--danger-color': '#ff6b6b',
            '--info-color': '#22b8cf',

            '--bg-primary': '#0d1117',
            '--bg-secondary': '#161b22',
            '--bg-tertiary': '#21262d',
            '--bg-glass': 'rgba(22, 27, 34, 0.8)',

            '--text-primary': '#f0f6fc',
            '--text-secondary': '#8b949e',
            '--text-tertiary': '#6e7681',

            '--border-color': 'rgba(240, 246, 252, 0.1)',
            '--shadow-color': 'rgba(0, 0, 0, 0.4)',

            '--card-bg': 'rgba(22, 27, 34, 0.8)',
            '--input-bg': 'rgba(33, 38, 45, 0.9)',

            '--gradient-start': '#4dabf7',
            '--gradient-end': '#9775fa',

            '--chart-grid': '#21262d',
            '--chart-positive': '#6aaa64',
            '--chart-positive-bg': 'rgba(106, 170, 100, 0.15)',
            '--chart-negative': '#ff6b6b',
            '--chart-negative-bg': 'rgba(255, 107, 107, 0.15)',
            '--chart-neutral': '#8b949e',
            '--chart-neutral-bg': 'rgba(139, 148, 158, 0.15)',

            // Legacy Mappings
            '--glass-bg': 'rgba(22, 27, 34, 0.8)',
            '--glass-bg-hover': 'rgba(30, 35, 45, 0.9)',
            '--glass-border': 'rgba(255, 255, 255, 0.1)',
            '--glass-shadow': 'rgba(0, 0, 0, 0.5)',
            '--text-muted': '#6e7681',
            '--accent-gold': '#4dabf7',
            '--accent-gold-light': '#77abff',
            '--accent-rose': '#9775fa',
            '--accent-pink': '#d63384'
        }
    },

    ocean: {
        name: 'Ocean',
        icon: '🌊',
        colors: {
            '--primary-color': '#0077b6',
            '--primary-color-rgb': '0, 119, 182',
            '--secondary-color': '#00b4d8',
            '--success-color': '#06d6a0',
            '--warning-color': '#ffd60a',
            '--danger-color': '#ef476f',
            '--info-color': '#48cae4',

            '--bg-primary': '#caf0f8',
            '--bg-secondary': '#ade8f4',
            '--bg-tertiary': '#90e0ef',
            '--bg-glass': 'rgba(202, 240, 248, 0.7)',

            '--text-primary': '#023047',
            '--text-secondary': '#126782',
            '--text-tertiary': '#219ebc',

            '--border-color': 'rgba(2, 48, 71, 0.15)',
            '--shadow-color': 'rgba(0, 119, 182, 0.2)',

            '--card-bg': 'rgba(255, 255, 255, 0.6)',
            '--input-bg': 'rgba(255, 255, 255, 0.8)',

            '--gradient-start': '#00b4d8',
            '--gradient-end': '#0077b6',

            '--chart-grid': '#ade8f4',
            '--chart-positive': '#006d77',
            '--chart-positive-bg': 'rgba(0, 109, 119, 0.2)',
            '--chart-negative': '#c1121f',
            '--chart-negative-bg': 'rgba(193, 18, 31, 0.2)',
            '--chart-neutral': '#126782',
            '--chart-neutral-bg': 'rgba(18, 103, 130, 0.2)',

            // Legacy Mappings
            '--glass-bg': 'rgba(255, 255, 255, 0.6)',
            '--glass-bg-hover': 'rgba(255, 255, 255, 0.8)',
            '--glass-border': 'rgba(0, 119, 182, 0.2)',
            '--glass-shadow': 'rgba(0, 119, 182, 0.15)',
            '--text-muted': '#219ebc',
            '--accent-gold': '#0077b6',
            '--accent-gold-light': '#48cae4',
            '--accent-rose': '#0096c7',
            '--accent-pink': '#ef476f'
        }
    },

    forest: {
        name: 'Forest',
        icon: '🌲',
        colors: {
            '--primary-color': '#2d6a4f',
            '--primary-color-rgb': '45, 106, 79',
            '--secondary-color': '#40916c',
            '--success-color': '#74c69d',
            '--warning-color': '#f4a261',
            '--danger-color': '#e76f51',
            '--info-color': '#52b788',

            '--bg-primary': '#d8f3dc',
            '--bg-secondary': '#b7e4c7',
            '--bg-tertiary': '#95d5b2',
            '--bg-glass': 'rgba(216, 243, 220, 0.7)',

            '--text-primary': '#1b4332',
            '--text-secondary': '#2d6a4f',
            '--text-tertiary': '#40916c',

            '--border-color': 'rgba(27, 67, 50, 0.15)',
            '--shadow-color': 'rgba(45, 106, 79, 0.2)',

            '--card-bg': 'rgba(255, 255, 255, 0.6)',
            '--input-bg': 'rgba(255, 255, 255, 0.8)',

            '--gradient-start': '#52b788',
            '--gradient-end': '#2d6a4f',

            '--chart-grid': '#b7e4c7',
            '--chart-positive': '#1b5e20',
            '--chart-positive-bg': 'rgba(27, 94, 32, 0.2)',
            '--chart-negative': '#b71c1c',
            '--chart-negative-bg': 'rgba(183, 28, 28, 0.2)',
            '--chart-neutral': '#2d6a4f',
            '--chart-neutral-bg': 'rgba(45, 106, 79, 0.2)',

            // Legacy Mappings
            '--glass-bg': 'rgba(255, 255, 255, 0.6)',
            '--glass-bg-hover': 'rgba(255, 255, 255, 0.8)',
            '--glass-border': 'rgba(45, 106, 79, 0.2)',
            '--glass-shadow': 'rgba(45, 106, 79, 0.15)',
            '--text-muted': '#40916c',
            '--accent-gold': '#2d6a4f',
            '--accent-gold-light': '#52b788',
            '--accent-rose': '#40916c',
            '--accent-pink': '#e76f51'
        }
    },

    sunset: {
        name: 'Sunset',
        icon: '🌅',
        colors: {
            '--primary-color': '#f77f00',
            '--primary-color-rgb': '247, 127, 0',
            '--secondary-color': '#d62828',
            '--success-color': '#06d6a0',
            '--warning-color': '#fcbf49',
            '--danger-color': '#d62828',
            '--info-color': '#4361ee',

            '--bg-primary': '#fff3e0',
            '--bg-secondary': '#ffe0b2',
            '--bg-tertiary': '#ffcc80',
            '--bg-glass': 'rgba(255, 243, 224, 0.7)',

            '--text-primary': '#37251b',
            '--text-secondary': '#6d4c41',
            '--text-tertiary': '#a1887f',

            '--border-color': 'rgba(55, 37, 27, 0.15)',
            '--shadow-color': 'rgba(247, 127, 0, 0.2)',

            '--card-bg': 'rgba(255, 255, 255, 0.6)',
            '--input-bg': 'rgba(255, 255, 255, 0.8)',

            '--gradient-start': '#f77f00',
            '--gradient-end': '#d62828',

            '--chart-grid': '#ffe0b2',
            '--chart-positive': '#388e3c',
            '--chart-positive-bg': 'rgba(56, 142, 60, 0.2)',
            '--chart-negative': '#c62828',
            '--chart-negative-bg': 'rgba(198, 40, 40, 0.2)',
            '--chart-neutral': '#6d4c41',
            '--chart-neutral-bg': 'rgba(109, 76, 65, 0.2)',

            // Legacy Mappings
            '--glass-bg': 'rgba(255, 255, 255, 0.6)',
            '--glass-bg-hover': 'rgba(255, 255, 255, 0.8)',
            '--glass-border': 'rgba(247, 127, 0, 0.2)',
            '--glass-shadow': 'rgba(247, 127, 0, 0.15)',
            '--text-muted': '#a1887f',
            '--accent-gold': '#f77f00',
            '--accent-gold-light': '#fcbf49',
            '--accent-rose': '#d62828',
            '--accent-pink': '#ef476f'
        }
    },

    'high-contrast': {
        name: 'High Contrast',
        icon: '⚫',
        colors: {
            '--primary-color': '#0000ff',
            '--primary-color-rgb': '0, 0, 255',
            '--secondary-color': '#000080',
            '--success-color': '#008000',
            '--warning-color': '#ff8c00',
            '--danger-color': '#ff0000',
            '--info-color': '#0000ff',

            '--bg-primary': '#ffffff',
            '--bg-secondary': '#f0f0f0',
            '--bg-tertiary': '#e0e0e0',
            '--bg-glass': 'rgba(255, 255, 255, 1)',

            '--text-primary': '#000000',
            '--text-secondary': '#000000',
            '--text-tertiary': '#000000',

            '--border-color': '#000000',
            '--shadow-color': 'none',

            '--card-bg': '#ffffff',
            '--input-bg': '#ffffff',

            '--gradient-start': '#0000ff',
            '--gradient-end': '#000080',

            '--chart-grid': '#000000',
            '--chart-positive': '#008000',
            '--chart-positive-bg': 'rgba(0, 128, 0, 0.2)',
            '--chart-negative': '#ff0000',
            '--chart-negative-bg': 'rgba(255, 0, 0, 0.2)',
            '--chart-neutral': '#000000',
            '--chart-neutral-bg': 'rgba(0, 0, 0, 0.2)',

            // Legacy Mappings
            '--glass-bg': '#ffffff',
            '--glass-bg-hover': '#f0f0f0',
            '--glass-border': '#000000',
            '--glass-shadow': 'none',
            '--text-muted': '#000000',
            '--accent-gold': '#0000ff',
            '--accent-gold-light': '#000080',
            '--accent-rose': '#000000',
            '--accent-pink': '#ff0000'
        }
    },

    purple: {
        name: 'Purple Haze',
        icon: '💜',
        colors: {
            '--primary-color': '#7209b7',
            '--primary-color-rgb': '114, 9, 183',
            '--secondary-color': '#b5179e',
            '--success-color': '#06d6a0',
            '--warning-color': '#f72585',
            '--danger-color': '#d00000',
            '--info-color': '#4cc9f0',

            '--bg-primary': '#f0e6ff',
            '--bg-secondary': '#e0ccff',
            '--bg-tertiary': '#d0b3ff',
            '--bg-glass': 'rgba(240, 230, 255, 0.7)',

            '--text-primary': '#3c096c',
            '--text-secondary': '#5a189a',
            '--text-tertiary': '#7b2cbf',

            '--border-color': 'rgba(60, 9, 108, 0.15)',
            '--shadow-color': 'rgba(114, 9, 183, 0.2)',

            '--card-bg': 'rgba(255, 255, 255, 0.6)',
            '--input-bg': 'rgba(255, 255, 255, 0.8)',

            '--gradient-start': '#b5179e',
            '--gradient-end': '#7209b7',

            '--chart-grid': '#e0ccff',
            '--chart-positive': '#1b5e20',
            '--chart-positive-bg': 'rgba(27, 94, 32, 0.2)',
            '--chart-negative': '#b71c1c',
            '--chart-negative-bg': 'rgba(183, 28, 28, 0.2)',
            '--chart-neutral': '#5a189a',
            '--chart-neutral-bg': 'rgba(90, 24, 154, 0.2)',

            // Legacy Mappings
            '--glass-bg': 'rgba(255, 255, 255, 0.6)',
            '--glass-bg-hover': 'rgba(255, 255, 255, 0.8)',
            '--glass-border': 'rgba(114, 9, 183, 0.2)',
            '--glass-shadow': 'rgba(114, 9, 183, 0.15)',
            '--text-muted': '#7b2cbf',
            '--accent-gold': '#7209b7',
            '--accent-gold-light': '#9d4edd',
            '--accent-rose': '#f72585',
            '--accent-pink': '#b5179e'
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.THEMES = THEMES;
}
