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
    this.currentMode = 'fast'; // fast, think, research
    this.soulManagerState = 'neutral'; // neutral, amber, green, red

    this.init();
  }

  /**
   * Initialize app
   */
  async init() {
    await this.loadChatHistory();
    this.attachEventListeners();
    this.renderMessages();
    this.initSoulManager();
    this.initModeSelector();

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

    // Mode selector
    document.querySelectorAll('.mode-selector-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchMode(btn.dataset.mode);
      });
    });

    // Shortcut commands (listen for / commands)
    if (input) {
      input.addEventListener('keyup', (e) => {
        if (e.key === '/' && input.value === '/') {
          this.showShortcutsMenu();
        }
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

    // Check for shortcut commands
    if (message.startsWith('/')) {
      this.handleShortcutCommand(message);
      input.value = '';
      return;
    }

    // Check for intent routing (before sending to AI)
    const intent = await this.detectIntent(message);
    if (intent && intent.route && intent.route !== '/command') {
      this.routeToTool(intent);
      input.value = '';
      return;
    }

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

  /**
   * Initialize Soul Manager visualization
   */
  initSoulManager() {
    const container = document.getElementById('soul-manager-container');
    if (!container) return;

    // Create ferrofluid-like canvas animation
    container.innerHTML = `
      <div class="soul-manager">
        <canvas id="soul-canvas" width="200" height="200"></canvas>
        <div class="soul-state-label">${this.getSoulStateLabel()}</div>
      </div>
    `;

    this.renderSoulAnimation();
  }

  /**
   * Get soul state label
   */
  getSoulStateLabel() {
    const labels = {
      'neutral': 'Idle',
      'amber': 'Thinking...',
      'green': 'Ready!',
      'red': 'Processing...'
    };
    return labels[this.soulManagerState] || 'Idle';
  }

  /**
   * Render soul animation (ferrofluid effect)
   */
  renderSoulAnimation() {
    const canvas = document.getElementById('soul-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Color based on state
    const colors = {
      'neutral': '#6B7280', // Gray
      'amber': '#F59E0B', // Amber
      'green': '#10B981', // Green
      'red': '#EF4444' // Red
    };

    const color = colors[this.soulManagerState] || colors.neutral;

    // Simple pulsing circle animation
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw pulsing circle
      const radius = 60 + Math.sin(frame * 0.05) * 10;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.fill();

      // Draw glow
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius + 20, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.fill();

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Update soul state
   */
  updateSoulState(state) {
    this.soulManagerState = state;

    const label = document.querySelector('.soul-state-label');
    if (label) {
      label.textContent = this.getSoulStateLabel();
    }

    this.renderSoulAnimation();
  }

  /**
   * Initialize mode selector
   */
  initModeSelector() {
    const container = document.getElementById('mode-selector-container');
    if (!container) return;

    const userTier = window.authManager?.user?.tier || 'free';

    container.innerHTML = `
      <div class="mode-selector">
        <button class="mode-selector-btn ${this.currentMode === 'fast' ? 'active' : ''}" data-mode="fast">
          <span class="mode-icon">⚡</span>
          <span class="mode-label">Fast</span>
        </button>
        <button class="mode-selector-btn ${this.currentMode === 'think' ? 'active' : ''}" data-mode="think" ${['free', 'guest'].includes(userTier) ? 'disabled' : ''}>
          <span class="mode-icon">🤔</span>
          <span class="mode-label">Think</span>
          ${['free', 'guest'].includes(userTier) ? '<span class="mode-badge">PRO</span>' : ''}
        </button>
        <button class="mode-selector-btn ${this.currentMode === 'research' ? 'active' : ''}" data-mode="research" ${userTier !== 'ultimate' ? 'disabled' : ''}>
          <span class="mode-icon">🔬</span>
          <span class="mode-label">Research</span>
          ${userTier !== 'ultimate' ? '<span class="mode-badge">ULTIMATE</span>' : ''}
        </button>
      </div>
    `;
  }

  /**
   * Switch AI mode
   */
  switchMode(mode) {
    const userTier = window.authManager?.user?.tier || 'free';

    // Check tier permissions
    if (mode === 'think' && ['free', 'guest'].includes(userTier)) {
      Toast.show({
        message: 'Think mode requires Pro tier. Upgrade to unlock!',
        type: 'warning'
      });
      return;
    }

    if (mode === 'research' && userTier !== 'ultimate') {
      Toast.show({
        message: 'Research mode requires Ultimate tier. Upgrade to unlock!',
        type: 'warning'
      });
      return;
    }

    this.currentMode = mode;

    // Update UI
    document.querySelectorAll('.mode-selector-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    Toast.show({
      message: `Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`,
      type: 'success'
    });
  }

  /**
   * Detect intent from user message
   */
  async detectIntent(message) {
    try {
      const response = await this.api.post('/command/parse', { query: message });
      return response.data;
    } catch (error) {
      console.error('Intent detection failed:', error);
      return null;
    }
  }

  /**
   * Route to appropriate tool based on intent
   */
  routeToTool(intent) {
    const routes = {
      '/matchmaker': '#matchmaker',
      '/versus': '#versus',
      '/explorer': '#explorer',
      '/intel': '#intel',
      '/appendices': '#appendices'
    };

    const hash = routes[intent.route];
    if (hash) {
      Toast.show({
        message: `Routing you to ${intent.intent}...`,
        type: 'info'
      });

      // Route to section
      setTimeout(() => {
        window.location.hash = hash;
      }, 500);
    }
  }

  /**
   * Handle shortcut commands
   */
  handleShortcutCommand(command) {
    const shortcuts = {
      '/match': '#matchmaker',
      '/matchmaker': '#matchmaker',
      '/vs': '#versus',
      '/versus': '#versus',
      '/compare': '#versus',
      '/explore': '#explorer',
      '/explorer': '#explorer',
      '/browse': '#explorer',
      '/intel': '#intel',
      '/news': '#intel',
      '/appendices': '#appendices',
      '/catalog': '#appendices',
      '/help': () => this.showHelp(),
      '/clear': () => this.clearChat()
    };

    const action = shortcuts[command.toLowerCase()];

    if (typeof action === 'function') {
      action();
    } else if (action) {
      Toast.show({
        message: `Routing to ${command}...`,
        type: 'info'
      });
      setTimeout(() => {
        window.location.hash = action;
      }, 500);
    } else {
      Toast.show({
        message: `Unknown command: ${command}. Type /help for available commands.`,
        type: 'warning'
      });
    }
  }

  /**
   * Show shortcuts menu
   */
  showShortcutsMenu() {
    const shortcuts = [
      { cmd: '/match', desc: 'Go to Matchmaker' },
      { cmd: '/vs', desc: 'Go to Versus' },
      { cmd: '/explore', desc: 'Go to Explorer' },
      { cmd: '/intel', desc: 'Go to Intel' },
      { cmd: '/catalog', desc: 'Go to Appendices' },
      { cmd: '/help', desc: 'Show help' },
      { cmd: '/clear', desc: 'Clear chat' }
    ];

    const menu = shortcuts.map(s => `${s.cmd} - ${s.desc}`).join('\n');

    this.addMessage({
      role: 'assistant',
      content: `**Available Shortcuts:**\n\n${menu}\n\nJust type the command and press Enter!`,
      timestamp: Date.now(),
      isSystem: true
    });
  }

  /**
   * Show help
   */
  showHelp() {
    this.showShortcutsMenu();
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
