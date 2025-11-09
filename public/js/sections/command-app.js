/**
 * Command App Logic
 * AI chat interface for laptop recommendations and queries
 */

import { ApiClient } from '../utils/apiClient.js';
import { Toast, Loader } from '../components/ui.js';
import { getAnalytics } from '../utils/analytics.js';
import { getDB } from '../utils/db.js';
import { sanitizeHtml } from '../utils/helpers.js';

export class CommandApp {
  constructor() {
    this.api = new ApiClient();
    this.analytics = getAnalytics();
    this.messages = [];
    this.isStreaming = false;
    this.currentStreamingMessage = null;

    this.init();
  }

  /**
   * Initialize app
   */
  async init() {
    await this.loadChatHistory();
    this.attachEventListeners();
    this.renderMessages();

    // Show welcome message if first visit
    if (this.messages.length === 0) {
      await this.showWelcomeMessage();
    }

    // Track page view
    if (this.analytics) {
      this.analytics.pageView('/sections/command.html');
    }

    // Focus on input
    document.getElementById('message-input')?.focus();
  }

  /**
   * Load chat history from IndexedDB
   */
  async loadChatHistory() {
    try {
      const db = await getDB();
      const history = await db.getPreference('chat_history');

      if (history && Array.isArray(history)) {
        this.messages = history.slice(-50); // Keep last 50 messages
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  /**
   * Save chat history to IndexedDB
   */
  async saveChatHistory() {
    try {
      const db = await getDB();
      await db.setPreference('chat_history', this.messages.slice(-50));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  /**
   * Show welcome message with catchphrase
   */
  async showWelcomeMessage() {
    // Fetch catchphrase from API
    let catchphrase = 'Yo nakama! Welcome to AI Bradaa Command!';

    try {
      const data = await this.api.get('/catchphrase');
      if (data.success && data.data.available) {
        catchphrase = data.data.catchphrase.text;
      }
    } catch (error) {
      console.warn('Failed to fetch catchphrase:', error);
      // Use fallback catchphrase
    }

    const welcomeMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `${catchphrase} 👋

I'm your AI laptop expert, ready to help you find the perfect laptop. You can ask me anything lah!

**Try asking me:**
- "What's the best laptop for gaming under RM 5,000?"
- "Compare MacBook Air with Dell XPS"
- "I need a laptop for video editing, any recommendations?"
- "Which brand has the best warranty in Malaysia?"

Go ahead, ask me anything about laptops! 😊`,
      timestamp: Date.now(),
      suggestions: [
        'Best gaming laptops under RM 6,000',
        'Laptops for students',
        'MacBook vs Windows for creative work'
      ]
    };

    this.messages.push(welcomeMessage);
    this.renderMessages();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Send message
    const form = document.getElementById('chat-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // Clear chat
    document.getElementById('clear-chat')?.addEventListener('click', () => {
      this.clearChat();
    });

    // Export chat
    document.getElementById('export-chat')?.addEventListener('click', () => {
      this.exportChat();
    });

    // Input auto-resize
    const input = document.getElementById('message-input');
    if (input) {
      input.addEventListener('input', () => {
        this.autoResizeInput(input);
      });
    }
  }

  /**
   * Send user message
   */
  async sendMessage() {
    const input = document.getElementById('message-input');

    if (!input || !input.value.trim()) return;

    const message = input.value.trim();

    // Add user message
    this.addMessage({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Clear input
    input.value = '';
    this.autoResizeInput(input);

    // Get AI response
    await this.getAIResponse(message);
  }

  /**
   * Get AI response from API
   */
  async getAIResponse(userMessage) {
    // Add typing indicator
    const typingId = this.addTypingIndicator();

    try {
      // Build context from recent messages
      const context = this.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call chat API
      const data = await this.api.post('/chat', {
        message: userMessage,
        context
      });

      // Remove typing indicator
      this.removeTypingIndicator(typingId);

      // Add AI response (backend returns { response: { message, role, emotion }, usage, quota })
      this.addMessage({
        role: 'assistant',
        content: data.response?.message || data.response,
        timestamp: Date.now(),
        emotion: data.response?.emotion,
        suggestions: data.suggestions || []
      });

      // Track interaction
      if (this.analytics) {
        this.analytics.track('chat_message', {
          messageLength: userMessage.length,
          responseLength: data.response.length
        });
      }

    } catch (error) {
      console.error('Failed to get AI response:', error);

      // Remove typing indicator
      this.removeTypingIndicator(typingId);

      // Show error message
      this.addMessage({
        role: 'assistant',
        content: 'Aiya sorry, something went wrong lah! Can you try again? If the problem continues, maybe check your internet connection or refresh the page.',
        timestamp: Date.now(),
        isError: true
      });

      if (this.analytics) {
        this.analytics.error(error, { context: 'chat_response' });
      }

      Toast.show({
        message: 'Failed to get response. Please try again.',
        type: 'error'
      });
    }
  }

  /**
   * Add message to chat
   */
  addMessage(message) {
    message.id = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.messages.push(message);
    this.saveChatHistory();
    this.renderMessages();
  }

  /**
   * Render all messages
   */
  renderMessages() {
    const container = document.getElementById('messages-container');

    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Render each message
    this.messages.forEach(message => {
      const messageEl = this.createMessageElement(message);
      container.appendChild(messageEl);
    });

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Create message element
   */
  createMessageElement(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.role} ${message.isError ? 'error' : ''}`;
    messageEl.dataset.messageId = message.id;

    if (message.role === 'user') {
      messageEl.innerHTML = `
        <div class="message-bubble user-message">
          <div class="message-content">${this.formatMessage(message.content)}</div>
          <div class="message-time">${this.formatTime(message.timestamp)}</div>
        </div>
      `;
    } else {
      messageEl.innerHTML = `
        <div class="message-bubble assistant-message ${message.isError ? 'error-message' : ''}">
          <div class="message-avatar">🤖</div>
          <div class="message-body">
            <div class="message-content">${this.formatMessage(message.content)}</div>
            ${message.suggestions && message.suggestions.length > 0 ? `
              <div class="message-suggestions">
                ${message.suggestions.map(suggestion => `
                  <button class="suggestion-btn" data-suggestion="${sanitizeHtml(suggestion)}">
                    ${suggestion}
                  </button>
                `).join('')}
              </div>
            ` : ''}
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
          </div>
        </div>
      `;

      // Attach suggestion click handlers
      messageEl.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = document.getElementById('message-input');
          if (input) {
            input.value = btn.dataset.suggestion;
            input.focus();
          }
        });
      });
    }

    return messageEl;
  }

  /**
   * Format message content (markdown-like)
   */
  formatMessage(content) {
    // Escape HTML
    let formatted = sanitizeHtml(content);

    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code `text`
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Links [text](url)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    return formatted;
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Otherwise show date
    return date.toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Add typing indicator
   */
  addTypingIndicator() {
    const container = document.getElementById('messages-container');

    if (!container) return null;

    const typingId = `typing-${Date.now()}`;

    const typingEl = document.createElement('div');
    typingEl.className = 'message assistant typing-indicator';
    typingEl.id = typingId;
    typingEl.innerHTML = `
      <div class="message-bubble assistant-message">
        <div class="message-avatar">🤖</div>
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    container.appendChild(typingEl);
    this.scrollToBottom();

    return typingId;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator(typingId) {
    if (!typingId) return;

    const typingEl = document.getElementById(typingId);
    if (typingEl) {
      typingEl.remove();
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    const container = document.getElementById('messages-container');

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Auto-resize input textarea
   */
  autoResizeInput(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  }

  /**
   * Clear chat history
   */
  async clearChat() {
    if (!confirm('Clear all chat history? This cannot be undone.')) {
      return;
    }

    this.messages = [];
    await this.saveChatHistory();
    this.renderMessages();
    this.showWelcomeMessage();

    Toast.show({
      message: 'Chat history cleared',
      type: 'success'
    });
  }

  /**
   * Export chat as text
   */
  exportChat() {
    if (this.messages.length === 0) {
      Toast.show({
        message: 'No messages to export',
        type: 'info'
      });
      return;
    }

    const text = this.messages
      .filter(m => m.id !== 'welcome')
      .map(m => {
        const time = this.formatTime(m.timestamp);
        const role = m.role === 'user' ? 'You' : 'AI Bradaa';
        return `[${time}] ${role}:\n${m.content}\n`;
      })
      .join('\n');

    // Create blob and download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-bradaa-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    Toast.show({
      message: 'Chat exported successfully',
      type: 'success'
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CommandApp();
  });
} else {
  new CommandApp();
}
