/**
 * Navigation Handler
 * Manages page switching between Calculator and Wordle pages
 */

class NavigationHandler {
    constructor() {
        this.currentPage = 'calculator-page';
        this.attachEventListeners();
    }

    attachEventListeners() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = item.dataset.page;
                this.switchPage(targetPage);
            });
        });
    }

    switchPage(pageId) {
        if (this.currentPage === pageId) return;

        // Get current and target pages
        const currentPageEl = document.getElementById(this.currentPage);
        const targetPageEl = document.getElementById(pageId);

        if (!currentPageEl || !targetPageEl) return;

        // Hide current page
        currentPageEl.classList.remove('active');
        currentPageEl.style.display = 'none';

        // Show target page with animation
        targetPageEl.style.display = 'block';
        targetPageEl.classList.add('active');
        targetPageEl.classList.add('page-transition-enter');

        // Remove animation class after animation completes
        setTimeout(() => {
            targetPageEl.classList.remove('page-transition-enter');
        }, 300);

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });

        // Update current page
        this.currentPage = pageId;

        // Save to localStorage
        localStorage.setItem('currentPage', pageId);

        // Trigger page-specific initialization
        this.onPageSwitch(pageId);
    }

    onPageSwitch(pageId) {
        if (pageId === 'wordle-page') {
            // Initialize Wordle game if needed
            if (window.wordleGame && !window.wordleGame.initialized) {
                window.wordleGame.init();
            }
        }
    }

    init() {
        // Set initial page display
        const calculatorPage = document.getElementById('calculator-page');
        const wordlePage = document.getElementById('wordle-page');

        if (calculatorPage) {
            calculatorPage.style.display = 'block';
            calculatorPage.classList.add('active');
        }
        if (wordlePage) {
            wordlePage.style.display = 'none';
        }

        // Restore last visited page
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage && document.getElementById(savedPage)) {
            this.switchPage(savedPage);
        }
    }
}

// Initialize navigation when DOM is ready
let navigationHandler;
document.addEventListener('DOMContentLoaded', () => {
    navigationHandler = new NavigationHandler();
    navigationHandler.init();
});
