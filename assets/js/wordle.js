/**
 * Wordle Game
 * A word guessing game with 6 attempts to guess a 5-letter word
 * Updated to load words from an external data/wordle-words.txt file
 */

class WordleGame {
    constructor() {
        this.wordList = []; // Will be loaded from file
        this.currentWord = '';
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameOver = false;
        this.initialized = false;
        this.wordsLoaded = false;

        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0
        };

        this.loadStats();
        this.loadWordList();
    }

    async loadWordList() {
        try {
            const response = await fetch('data/wordle-words.txt');
            const text = await response.text();

            // Split by newlines and filter out empty lines
            this.wordList = text
                .split('\n')
                .map(word => word.trim().toUpperCase())
                .filter(word => word.length === 5);

            this.wordsLoaded = true;
            console.log(`Loaded ${this.wordList.length} words`);

            // Start game if already initialized
            if (this.initialized && this.currentWord === '') {
                this.startNewGame();
            }
        } catch (error) {
            console.error('Failed to load word list:', error);
            this.showMessage('Failed to load word list. Please refresh.', 'lose');

            // Fallback to a small hardcoded list
            this.wordList = [
                'ABOUT', 'ABOVE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN', 'AGENT',
                'AGREE', 'AHEAD', 'ALLOW', 'ALONE', 'ALONG', 'ANGRY', 'APART', 'APPLE',
                'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ASIDE', 'ASSET', 'AUDIO', 'AVOID',
                'AWARD', 'AWARE', 'BASIC', 'BEACH', 'BEGIN', 'BEING', 'BELOW', 'BLACK',
                'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BRAIN', 'BRAND', 'BREAD', 'BREAK',
                'BRING', 'BROAD', 'BROWN', 'BUILD', 'BUILT', 'CARRY', 'CATCH', 'CAUSE',
                'CHAIR', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD',
                'CHINA', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLOCK', 'CLOSE',
                'COACH', 'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH',
                'CRAZY', 'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'DAILY', 'DANCE',
                'DEATH', 'DEPTH', 'DOUBT', 'DRAFT', 'DRAMA', 'DREAM', 'DRESS', 'DRINK',
                'DRIVE', 'EARLY', 'EARTH', 'EIGHT', 'EMPTY', 'ENJOY', 'ENTER', 'ENTRY',
                'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH',
                'FALSE', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED',
                'FLASH', 'FLOOR', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND',
                'FRAME', 'FRANK', 'FRESH', 'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIVEN',
                'GLASS', 'GLOBE', 'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS',
                'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST',
                'GUIDE', 'HAPPY', 'HEART', 'HEAVY', 'HENCE', 'HENRY', 'HORSE', 'HOTEL',
                'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN'
            ];
            this.wordsLoaded = true;
        }
    }

    init() {
        if (this.initialized) return;

        this.attachEventListeners();

        // Start game only if words are loaded
        if (this.wordsLoaded) {
            this.startNewGame();
        }

        this.initialized = true;
    }

    attachEventListeners() {
        // Keyboard clicks
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.addEventListener('click', () => {
                this.handleKeyPress(key.dataset.key);
            });
        });

        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('wordle-page').style.display === 'none') return;

            if (e.key === 'Enter') {
                this.handleKeyPress('ENTER');
            } else if (e.key === 'Backspace') {
                this.handleKeyPress('BACKSPACE');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.handleKeyPress(e.key.toUpperCase());
            }
        });

        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
    }

    startNewGame() {
        if (!this.wordsLoaded || this.wordList.length === 0) {
            this.showMessage('Loading words...', '');
            return;
        }

        // Pick random word
        this.currentWord = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        console.log('Answer:', this.currentWord); // For testing - remove in production

        // Reset game state
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameOver = false;

        // Clear board
        const boxes = document.querySelectorAll('.letter-box');
        boxes.forEach(box => {
            box.textContent = '';
            box.className = 'letter-box';
        });

        // Clear keyboard colors
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.remove('correct', 'present', 'absent');
        });

        // Clear message
        document.getElementById('game-message').textContent = '';
        document.getElementById('game-message').className = 'game-message';
    }

    handleKeyPress(key) {
        if (this.gameOver) return;

        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.deleteLetter();
        } else if (this.currentTile < 5) {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        const row = document.querySelectorAll('.board-row')[this.currentRow];
        const box = row.children[this.currentTile];

        box.textContent = letter;
        box.classList.add('filled');
        this.currentTile++;
    }

    deleteLetter() {
        if (this.currentTile === 0) return;

        this.currentTile--;
        const row = document.querySelectorAll('.board-row')[this.currentRow];
        const box = row.children[this.currentTile];

        box.textContent = '';
        box.classList.remove('filled');
    }

    submitGuess() {
        if (this.currentTile < 5) {
            this.showMessage('Not enough letters');
            this.shakeRow();
            return;
        }

        // Get guess
        const row = document.querySelectorAll('.board-row')[this.currentRow];
        let guess = '';
        for (let i = 0; i < 5; i++) {
            guess += row.children[i].textContent;
        }

        // Check if valid word
        if (!this.wordList.includes(guess)) {
            this.showMessage('Not in word list');
            this.shakeRow();
            return;
        }

        // Check letters
        this.checkWord(guess);

        // Check win/loss
        if (guess === this.currentWord) {
            this.gameOver = true;
            this.stats.gamesPlayed++;
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            this.saveStats();
            this.updateStatsDisplay();

            setTimeout(() => {
                this.showMessage('You won!', 'win');
            }, 1500);
        } else if (this.currentRow === 5) {
            this.gameOver = true;
            this.stats.gamesPlayed++;
            this.stats.currentStreak = 0;
            this.saveStats();
            this.updateStatsDisplay();

            setTimeout(() => {
                this.showMessage(`The word was: ${this.currentWord}`, 'lose');
            }, 1500);
        } else {
            this.currentRow++;
            this.currentTile = 0;
        }
    }

    checkWord(guess) {
        const row = document.querySelectorAll('.board-row')[this.currentRow];
        const letterCount = {};

        // Count letters in answer
        for (let letter of this.currentWord) {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }

        // First pass: mark correct letters
        for (let i = 0; i < 5; i++) {
            const box = row.children[i];
            const letter = guess[i];

            if (letter === this.currentWord[i]) {
                setTimeout(() => {
                    box.classList.add('correct');
                    this.updateKeyboard(letter, 'correct');
                }, i * 300);
                letterCount[letter]--;
            }
        }

        // Second pass: mark present/absent letters
        for (let i = 0; i < 5; i++) {
            const box = row.children[i];
            const letter = guess[i];

            if (letter !== this.currentWord[i]) {
                if (this.currentWord.includes(letter) && letterCount[letter] > 0) {
                    setTimeout(() => {
                        box.classList.add('present');
                        this.updateKeyboard(letter, 'present');
                    }, i * 300);
                    letterCount[letter]--;
                } else {
                    setTimeout(() => {
                        box.classList.add('absent');
                        this.updateKeyboard(letter, 'absent');
                    }, i * 300);
                }
            }
        }
    }

    updateKeyboard(letter, state) {
        const key = document.querySelector(`.key[data-key="${letter}"]`);
        if (!key) return;

        // Don't downgrade key color
        if (key.classList.contains('correct')) return;
        if (key.classList.contains('present') && state === 'absent') return;

        key.classList.remove('correct', 'present', 'absent');
        key.classList.add(state);
    }

    shakeRow() {
        const row = document.querySelectorAll('.board-row')[this.currentRow];
        row.classList.add('shake');
        setTimeout(() => {
            row.classList.remove('shake');
        }, 500);
    }

    showMessage(text, type = '') {
        const messageEl = document.getElementById('game-message');
        messageEl.textContent = text;
        messageEl.className = 'game-message ' + type;

        setTimeout(() => {
            if (messageEl.textContent === text) {
                messageEl.textContent = '';
                messageEl.className = 'game-message';
            }
        }, 3000);
    }

    loadStats() {
        const saved = localStorage.getItem('wordleStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
        this.updateStatsDisplay();
    }

    saveStats() {
        localStorage.setItem('wordleStats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('games-played').textContent = this.stats.gamesPlayed;

        const winPercentage = this.stats.gamesPlayed > 0
            ? Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100)
            : 0;
        document.getElementById('win-percentage').textContent = winPercentage;

        document.getElementById('current-streak').textContent = this.stats.currentStreak;
    }
}

// Initialize Wordle game
let wordleGame;
document.addEventListener('DOMContentLoaded', () => {
    wordleGame = new WordleGame();
    window.wordleGame = wordleGame; // Make globally accessible
});
