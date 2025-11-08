/**
 * Command Module
 * AI Bradaa Command hub with souls integration and Deck routing
 */

import { apiClient } from '../shared/utils/api.mjs';
import { SoulManager } from '../../ai_pod/prototypes/soul_v1/fsm.mjs';

export class Command {
  constructor() {
    this.soulManager = new SoulManager();
    this.conversationHistory = [];
    this.currentMode = 'fast'; // 'fast' or 'think'
    this.isProcessing = false;
  }

  /**
   * Initialize command system
   */
  async init() {
    // Subscribe to soul state changes for UI updates
    this.soulManager.subscribe((from, to, data) => {
      this.onSoulStateChange(from, to, data);
    });

    return true;
  }

  /**
   * Process user command
   */
  async processCommand(query) {
    if (this.isProcessing) {
      throw new Error('Already processing a command');
    }

    this.isProcessing = true;

    // Update soul to amber (processing)
    const requestId = `req-${Date.now()}`;
    this.soulManager.onApiStart(requestId);

    try {
      // Check if it's a shortcut command
      if (query.startsWith('/')) {
        return await this.processShortcut(query);
      }

      // Parse intent
      const intent = await this.parseIntent(query);

      // Route based on intent
      if (intent?.route && intent.route !== '/command') {
        return {
          type: 'route',
          route: intent.route,
          message: `Routing to ${intent.route}...`,
        };
      }

      // Process as AI command
      const startTime = Date.now();

      const response = await apiClient.post('/api/command', {
        query,
        mode: this.currentMode,
        context: this.getContext(),
      });

      const latency = Date.now() - startTime;

      // Update soul to green (success)
      this.soulManager.onApiSuccess(requestId, latency);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      });

      this.conversationHistory.push({
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        metadata: {
          mode: this.currentMode,
          model: response.data.model,
          tokens: response.data.tokens,
          latency,
        },
      });

      this.isProcessing = false;

      return {
        type: 'response',
        response: response.data.response,
        metadata: {
          mode: this.currentMode,
          latency,
          tokens: response.data.tokens,
        },
      };
    } catch (error) {
      // Update soul to red (error)
      this.soulManager.onApiError(requestId, error);

      this.isProcessing = false;

      throw error;
    }
  }

  /**
   * Process shortcut command (e.g., /match, /vs, /explore)
   */
  async processShortcut(command) {
    const shortcuts = {
      '/match': { route: '/matchmaker', description: 'Find your perfect laptop' },
      '/matchmaker': { route: '/matchmaker', description: 'Find your perfect laptop' },
      '/vs': { route: '/versus', description: 'Compare laptops side-by-side' },
      '/versus': { route: '/versus', description: 'Compare laptops' },
      '/compare': { route: '/versus', description: 'Compare laptops' },
      '/explore': { route: '/explorer', description: 'Browse all laptops' },
      '/browse': { route: '/explorer', description: 'Browse all laptops' },
      '/intel': { route: '/intel', description: 'Latest news and deals' },
      '/news': { route: '/intel', description: 'Latest news' },
      '/appendices': { route: '/appendices', description: 'Full catalog' },
      '/catalog': { route: '/appendices', description: 'Full catalog' },
      '/camera': { route: '/camera-tech', description: 'Camera specs' },
      '/help': { route: null, description: 'Show available commands' },
    };

    const shortcut = shortcuts[command.toLowerCase()];

    if (!shortcut) {
      throw new Error(`Unknown command: ${command}. Type /help for available commands.`);
    }

    if (command === '/help') {
      const helpText = Object.entries(shortcuts)
        .map(([cmd, info]) => `${cmd} - ${info.description}`)
        .join('\n');

      return {
        type: 'help',
        commands: shortcuts,
        helpText,
      };
    }

    return {
      type: 'route',
      route: shortcut.route,
      description: shortcut.description,
    };
  }

  /**
   * Parse user intent
   */
  async parseIntent(query) {
    try {
      const response = await apiClient.post('/api/command/parse', { query });
      return response.data;
    } catch (error) {
      console.error('Intent parsing failed:', error);
      return null;
    }
  }

  /**
   * Get conversation context
   */
  getContext() {
    // Last 5 messages for context
    const recentHistory = this.conversationHistory.slice(-5);

    return {
      history: recentHistory,
      mode: this.currentMode,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Toggle between fast and think modes
   */
  toggleMode() {
    this.currentMode = this.currentMode === 'fast' ? 'think' : 'fast';
    return this.currentMode;
  }

  /**
   * Set command mode explicitly
   */
  setMode(mode) {
    if (mode !== 'fast' && mode !== 'think') {
      throw new Error('Invalid mode. Use "fast" or "think".');
    }
    this.currentMode = mode;
    return this.currentMode;
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get soul state
   */
  getSoulState() {
    return {
      state: this.soulManager.getState(),
      data: this.soulManager.getStateData(),
    };
  }

  /**
   * Soul state change handler (override in UI)
   */
  onSoulStateChange(from, to, data) {
    // Override this in UI code to update visual state
    console.log(`Soul: ${from} → ${to}`, data);
  }

  /**
   * Generate Deck for current conversation
   */
  async generateDeck() {
    if (this.conversationHistory.length === 0) {
      throw new Error('No conversation to generate Deck from');
    }

    const lastUserMessage = this.conversationHistory
      .filter(m => m.role === 'user')
      .slice(-1)[0];

    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    try {
      const response = await apiClient.post('/api/deck/generate', {
        query: lastUserMessage.content,
        mode: 'standard',
      });

      return response.data;
    } catch (error) {
      console.error('Deck generation failed:', error);
      throw error;
    }
  }

  /**
   * Export Deck to format
   */
  async exportDeck(cards, format = 'md') {
    try {
      const response = await apiClient.post('/api/deck/export', {
        cards,
        format,
      }, {
        headers: {
          'Accept': format === 'json' ? 'application/json' : 'text/plain',
        },
      });

      return response;
    } catch (error) {
      console.error('Deck export failed:', error);
      throw error;
    }
  }
}

export default Command;
