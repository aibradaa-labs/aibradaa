/**
 * Command Tool - AI Bradaa Command Interface
 * AI Bradaa - Natural language laptop queries (Pro/Ultimate only)
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Command {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.userTier = 'free';
  }

  async init() {
    await this.loadUserTier();
    await this.loadConversationHistory();
    this.render();
    this.attachEventListeners();
  }

  async loadUserTier() {
    try {
      const response = await apiClient.getUserProfile();
      this.userTier = response.data.user.tier || 'free';
    } catch (error) {
      console.warn('Failed to load user tier, defaulting to free');
      this.userTier = 'free';
    }
  }

  async loadConversationHistory() {
    const history = await storage.getHistory(20);
    this.conversationHistory = history
      .filter(h => h.type === 'command')
      .map(h => ({ role: h.role, content: h.content }))
      .reverse()
      .slice(0, 10); // Last 10 messages
  }

  render() {
    const container = document.getElementById('commandContainer') || document.body;

    if (this.userTier === 'free') {
      container.innerHTML = this.renderUpgradePrompt();
      return;
    }

    container.innerHTML = `
      <div class="command-wrapper">

        <!-- Header -->
        <div class="command-header">
          <h1>🤖 AI Bradaa Command</h1>
          <p>Ask me anything in plain English or Manglish</p>
          <div class="tier-badge ${this.userTier}">${this.userTier.toUpperCase()}</div>
        </div>

        <!-- Conversation Area -->
        <div class="conversation-container" id="conversationArea">
          ${this.conversationHistory.length === 0 ? this.renderWelcomeMessage() : ''}
          ${this.conversationHistory.map(msg => this.renderMessage(msg)).join('')}
        </div>

        <!-- Input Area -->
        <div class="command-input-area">
          <div class="input-wrapper">
            <textarea
              id="commandInput"
              class="command-textarea"
              placeholder='Type your question... e.g., "Best laptop for AutoCAD under RM5k?"'
              rows="1"
              ${this.isProcessing ? 'disabled' : ''}
            ></textarea>
            <button
              id="sendBtn"
              class="send-btn"
              ${this.isProcessing ? 'disabled' : ''}
              aria-label="Send message">
              ${this.isProcessing ? '⏳' : '➤'}
            </button>
          </div>
          <div class="input-hints">
            <button class="hint-btn" data-prompt="Best gaming laptop under RM6000?">
              Gaming under RM6k
            </button>
            <button class="hint-btn" data-prompt="Compare MacBook Pro vs ThinkPad X1">
              MacBook vs ThinkPad
            </button>
            <button class="hint-btn" data-prompt="Lightest laptop with good battery?">
              Light + Long battery
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn" id="clearConversationBtn">
            <span>🗑️</span> Clear Conversation
          </button>
          <button class="action-btn" id="exportBtn">
            <span>📥</span> Export Chat
          </button>
        </div>

      </div>
    `;

    this.scrollToBottom();
    this.attachEventListeners();
  }

  renderUpgradePrompt() {
    return `
      <div class="upgrade-prompt">
        <div class="upgrade-icon">🤖</div>
        <h2>AI Bradaa Command</h2>
        <p class="upgrade-subtitle">
          Talk to AI Bradaa in natural language and get personalized laptop recommendations
        </p>

        <div class="upgrade-features">
          <div class="feature-item">
            <span class="feature-icon">💬</span>
            <div>
              <h4>Natural Language Queries</h4>
              <p>Ask in plain English or Manglish</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🧠</span>
            <div>
              <h4>AI-Powered Insights</h4>
              <p>Get expert recommendations backed by 84-mentor system</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎯</span>
            <div>
              <h4>Context-Aware Responses</h4>
              <p>Remembers your preferences and past questions</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <div>
              <h4>Detailed Comparisons</h4>
              <p>Ask to compare laptops and get in-depth analysis</p>
            </div>
          </div>
        </div>

        <div class="upgrade-cta">
          <a href="/pricing.html#pro" class="btn btn-primary btn-large">
            Upgrade to Pro - RM30/month
          </a>
          <p class="upgrade-note">or try <strong>Ultimate</strong> for RM80/month with unlimited queries</p>
        </div>

        <div class="free-alternatives">
          <h4>Free Alternative Tools:</h4>
          <a href="#matchmaker" class="alt-link">🎯 Matchmaker (5-question wizard)</a>
          <a href="#explorer" class="alt-link">🔍 Explorer (browse top 35 laptops)</a>
        </div>
      </div>
    `;
  }

  renderWelcomeMessage() {
    return `
      <div class="welcome-message">
        <div class="assistant-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <p><strong>Yo, what's up! I'm AI Bradaa, your laptop bradaa.</strong></p>
            <p>Ask me anything lah — best laptop for gaming, coding, video editing, whatever you need. I got you covered with 100+ laptops analyzed and 84 mentors backing every recommendation.</p>
            <p><em>Try asking: "Best laptop for software development under RM7k?"</em></p>
          </div>
        </div>
      </div>
    `;
  }

  renderMessage(message) {
    const isUser = message.role === 'user';

    return `
      <div class="${isUser ? 'user-message' : 'assistant-message'}">
        ${!isUser ? '<div class="message-avatar">🤖</div>' : ''}
        <div class="message-content">
          ${this.formatMessageContent(message.content)}
          ${message.metadata ? this.renderMetadata(message.metadata) : ''}
        </div>
        ${isUser ? '<div class="message-avatar user-avatar">👤</div>' : ''}
      </div>
    `;
  }

  formatMessageContent(content) {
    // Simple markdown-like formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    return `<p>${formatted}</p>`;
  }

  renderMetadata(metadata) {
    if (!metadata) return '';

    return `
      <div class="message-metadata">
        ${metadata.composite_score ? `<span class="metadata-badge">Score: ${metadata.composite_score}/100</span>` : ''}
        ${metadata.mentors_consulted ? `<span class="metadata-badge">${metadata.mentors_consulted} mentors</span>` : ''}
        ${metadata.tokens_used ? `<span class="metadata-badge">${metadata.tokens_used} tokens</span>` : ''}
      </div>
    `;
  }

  attachEventListeners() {
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    const commandInput = document.getElementById('commandInput');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (commandInput) {
      // Auto-resize textarea
      commandInput.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
      });

      // Send on Enter (Shift+Enter for new line)
      commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      // Focus input
      commandInput.focus();
    }

    // Hint buttons
    document.querySelectorAll('.hint-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.target.dataset.prompt;
        if (commandInput) {
          commandInput.value = prompt;
          commandInput.focus();
        }
      });
    });

    // Clear conversation
    const clearBtn = document.getElementById('clearConversationBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear entire conversation?')) {
          this.conversationHistory = [];
          this.render();
        }
      });
    }

    // Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportConversation());
    }
  }

  async handleSendMessage() {
    const input = document.getElementById('commandInput');
    const message = input?.value.trim();

    if (!message || this.isProcessing) return;

    // Add user message
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Clear input and render
    input.value = '';
    input.style.height = 'auto';
    this.isProcessing = true;
    this.render();

    // Save to storage
    await storage.addHistory({
      type: 'command',
      role: 'user',
      content: message
    });

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Call AI API
      const response = await apiClient.executeCommand(message, {
        conversationHistory: this.conversationHistory.slice(-5) // Last 5 messages for context
      });

      // Remove typing indicator
      this.removeTypingIndicator();

      // Add assistant response
      this.conversationHistory.push({
        role: 'assistant',
        content: response.data.response,
        metadata: response.data.metadata,
        timestamp: Date.now()
      });

      // Save to storage
      await storage.addHistory({
        type: 'command',
        role: 'assistant',
        content: response.data.response,
        metadata: response.data.metadata
      });

    } catch (error) {
      this.removeTypingIndicator();

      let errorMessage = 'Sorry bro, something went wrong. Please try again.';

      if (error.status === 429) {
        errorMessage = '⚠️ You\'ve hit your quota limit for this month. Upgrade to Pro for more queries!';
      } else if (error.status === 401) {
        errorMessage = '⚠️ Session expired. Please refresh and log in again.';
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now()
      });
    } finally {
      this.isProcessing = false;
      this.render();
    }
  }

  showTypingIndicator() {
    const conversationArea = document.getElementById('conversationArea');
    if (!conversationArea) return;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    conversationArea.appendChild(indicator);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const conversationArea = document.getElementById('conversationArea');
      if (conversationArea) {
        conversationArea.scrollTop = conversationArea.scrollHeight;
      }
    }, 100);
  }

  async exportConversation() {
    const markdown = this.conversationHistory
      .map(msg => {
        const role = msg.role === 'user' ? '**You:**' : '**AI Bradaa:**';
        return `${role}\n${msg.content}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-bradaa-conversation-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const command = new Command();
    command.init();
  });
} else {
  const command = new Command();
  command.init();
}
