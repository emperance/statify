/**
 * Natural Language Query Handler
 * Chat-style interface for asking questions about statistical data
 */

const NLQueryHandler = {
    conversationHistory: [],
    currentData: null,
    currentStats: null,

    /**
     * Initialize the query handler
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        const queryInput = document.getElementById('nl-query-input');
        const sendBtn = document.getElementById('nl-send-btn');
        const clearBtn = document.getElementById('nl-clear-btn');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendQuery());
        }

        if (queryInput) {
            queryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendQuery();
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearConversation());
        }

        // Listen for suggested questions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggested-question')) {
                const question = e.target.dataset.question;
                if (question && queryInput) {
                    queryInput.value = question;
                    this.sendQuery();
                }
            }
        });
    },

    /**
     * Update data context when new calculations are made
     */
    setDataContext(data, statistics) {
        this.currentData = data;
        this.currentStats = statistics;
        this.showQueryPanel();
    },

    /**
     * Show the query panel
     */
    showQueryPanel() {
        const panel = document.getElementById('nl-query-panel');
        if (panel) {
            panel.style.display = 'block';
        }
    },

    /**
     * Hide the query panel
     */
    hideQueryPanel() {
        const panel = document.getElementById('nl-query-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    },

    /**
     * Send a query to the AI
     */
    async sendQuery() {
        const queryInput = document.getElementById('nl-query-input');
        const sendBtn = document.getElementById('nl-send-btn');
        const chatContainer = document.getElementById('nl-chat-messages');

        if (!queryInput || !chatContainer) return;

        const question = queryInput.value.trim();
        if (!question) return;

        if (!this.currentData || this.currentData.length === 0) {
            this.addMessage('assistant', 'Please calculate some data first before asking questions.');
            return;
        }

        // Add user message to chat
        this.addMessage('user', question);
        queryInput.value = '';

        // Show loading
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="spinner-small"></span>';
        }

        const loadingId = this.addMessage('assistant', '<span class="typing-indicator"><span></span><span></span><span></span></span>', true);

        try {
            const response = await fetch('/api/ai_query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    data: this.currentData,
                    statistics: this.currentStats,
                    conversation_history: this.conversationHistory.slice(-10) // Last 10 exchanges
                })
            });

            const data = await response.json();

            // Remove loading message
            this.removeMessage(loadingId);

            if (data.success) {
                this.addMessage('assistant', data.answer);
                this.conversationHistory.push({ question, answer: data.answer });

                // Handle visualization suggestion
                if (data.visualization && data.visualization.type !== 'none') {
                    this.suggestVisualization(data.visualization);
                }
            } else {
                this.addMessage('assistant', data.error || 'Sorry, I couldn\'t process your question. Please try again.');
            }
        } catch (error) {
            console.error('NL Query error:', error);
            this.removeMessage(loadingId);
            this.addMessage('assistant', 'Connection error. Please try again.');
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '➤';
            }
        }
    },

    /**
     * Add a message to the chat
     */
    addMessage(role, content, isTemporary = false) {
        const chatContainer = document.getElementById('nl-chat-messages');
        if (!chatContainer) return null;

        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `chat-message chat-message--${role}`;

        const avatar = role === 'user' ? '' : '';
        messageDiv.innerHTML = `
            <div class="chat-avatar">${avatar}</div>
            <div class="chat-bubble">${this.formatMessage(content)}</div>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageId;
    },

    /**
     * Remove a message by ID
     */
    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    },

    /**
     * Format message content (basic markdown-like formatting)
     */
    formatMessage(content) {
        if (content.includes('<')) return content; // Already HTML

        // Convert newlines to <br>
        content = content.replace(/\n/g, '<br>');

        // Bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Inline code
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');

        // Numbers highlighting
        content = content.replace(/(\d+\.?\d*)/g, '<span class="highlight-number">$1</span>');

        return content;
    },

    /**
     * Suggest a visualization
     */
    suggestVisualization(viz) {
        const chatContainer = document.getElementById('nl-chat-messages');
        if (!chatContainer || !viz.type || viz.type === 'none') return;

        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'chat-suggestion';
        suggestionDiv.innerHTML = `
            <span class="suggestion-icon"></span>
            <span>${viz.description || `A ${viz.type} might help visualize this`}</span>
            <button class="show-viz-btn" data-type="${viz.type}">Show ${viz.type}</button>
        `;

        suggestionDiv.querySelector('.show-viz-btn').addEventListener('click', () => {
            this.showVisualization(viz.type);
        });

        chatContainer.appendChild(suggestionDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    },

    /**
     * Show visualization (trigger charts module)
     */
    showVisualization(type) {
        if (typeof ChartModule !== 'undefined') {
            if (type === 'histogram') {
                ChartModule.renderHistogram(this.currentData, this.currentStats);
            } else if (type === 'boxplot') {
                ChartModule.renderBoxPlot(this.currentData, this.currentStats);
            }
        }
    },

    /**
     * Clear conversation
     */
    clearConversation() {
        const chatContainer = document.getElementById('nl-chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div class="chat-welcome">
                    <span class="welcome-icon">?</span>
                    <p>Ask me anything about your data!</p>
                    <div class="suggested-questions">
                        <button class="suggested-question" data-question="What is the average of my data?">What's the average?</button>
                        <button class="suggested-question" data-question="Are there any outliers in my data?">Any outliers?</button>
                        <button class="suggested-question" data-question="Is my data normally distributed?">Is it normally distributed?</button>
                        <button class="suggested-question" data-question="Summarize my data">Summarize my data</button>
                    </div>
                </div>
            `;
        }
        this.conversationHistory = [];
    },

    /**
     * Get conversation history
     */
    getHistory() {
        return this.conversationHistory;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => NLQueryHandler.init());
