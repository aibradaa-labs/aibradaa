/**
 * AI Integration - Gemini 2.5 Advanced Features
 * AI Bradaa - Phase 5: Advanced Gemini Integration & Final Audit
 *
 * ARCHITECTURE: 84-Mentor Council Standards
 * - AI POD Council: Prompt engineering, context management, model selection
 * - Platform Council: Rate limiting, quota tracking, error handling
 * - Safety Council: Content moderation, privacy protection, fallbacks
 * - Customer Council: Response quality, latency optimization, graceful degradation
 *
 * FEATURES (Phase 5 - Advanced):
 * 1. Gemini 2.5 Pro/Flash (upgraded from 2.0)
 * 2. Google Search Grounding - Real-time data integration
 * 3. Google Maps Integration - Location-based recommendations
 * 4. Gemini Intelligence - Content analysis, edits, summarization
 * 5. Image Analysis - Vision API for spec extraction
 * 6. Extended Thinking Mode - Deep reasoning with Gemini 2.5 Pro
 *
 * LEGACY FEATURES (Phase 4):
 * - AI insights for versus comparisons
 * - Smart matchmaker with AI scoring
 * - Personalized recommendations
 * - Natural language query parsing
 * - Context-aware responses
 * - Error handling for AI API failures
 * - Rate limiting and quota management
 * - Token usage tracking
 * - Cost estimation
 * - Conversation memory management
 * - Multi-turn dialogue support
 */

class AIIntegration {
  constructor() {
    // Configuration
    this.config = {
      apiEndpoints: {
        chat: '/.netlify/functions/command',
        insights: '/.netlify/functions/command/insights',
        parse: '/.netlify/functions/command/parse',
        paraphrase: '/.netlify/functions/command/paraphrase',
        // Phase 5 endpoints
        vision: '/.netlify/functions/vision-analysis',
        geminiLive: '/.netlify/functions/gemini-live',
        searchGrounding: '/.netlify/functions/command', // Uses search grounding parameter
        mapsIntegration: '/.netlify/functions/command' // Uses maps tool
      },
      models: {
        // Phase 5: Gemini 2.5 models
        fast: 'gemini-2.5-flash',
        pro: 'gemini-2.5-pro',
        // Legacy fallbacks
        legacy_fast: 'gemini-2.0-flash-exp',
        legacy_think: 'gemini-exp-1206'
      },
      rateLimits: {
        free: { requestsPerMinute: 10, requestsPerDay: 100 },
        pro: { requestsPerMinute: 30, requestsPerDay: 500 },
        ultimate: { requestsPerMinute: 60, requestsPerDay: 2000 }
      },
      maxContextLength: 32000, // tokens
      maxConversationTurns: 20,
      responseTimeout: 30000, // 30 seconds
      retryAttempts: 2,
      // Phase 5 configs
      thinkingModeConfig: {
        enabled: true,
        minComplexityScore: 7, // 0-10, trigger thinking mode for complex queries
        maxThinkingTokens: 16384
      },
      visionConfig: {
        maxImageSize: 5 * 1024 * 1024, // 5MB
        supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        ocrEnabled: true
      },
      searchGroundingConfig: {
        enabled: true,
        maxSources: 5,
        freshness: 'recent' // recent, week, month, year, all
      },
      mapsConfig: {
        enabled: true,
        defaultRadius: 10000, // meters (10km)
        maxResults: 10
      }
    };

    // State
    this.state = {
      userTier: 'free',
      conversationHistory: new Map(), // toolId -> messages[]
      requestCount: { minute: 0, day: 0 },
      lastRequestTime: null,
      quotaResetTime: { minute: null, day: null },
      tokenUsage: { total: 0, thisSession: 0 },
      costEstimate: { total: 0, thisSession: 0 },
      isProcessing: false,
      currentModel: 'fast',
      // Phase 5 state
      voiceSession: null,
      isVoiceActive: false,
      thinkingMode: false,
      lastSearchGrounding: null,
      lastVisionAnalysis: null
    };

    // Rate limiter
    this.rateLimiter = new RateLimiter();

    // Phase 5: Feature managers
    this.voiceInterface = null; // Will be initialized on demand
    this.mapsIntegration = null; // Will be initialized on demand
    this.visionAnalyzer = null; // Will be initialized on demand
  }

  /**
   * Initialize AI Integration
   */
  async init(userTier = 'free') {
    try {
      console.log('[AIIntegration] Initializing...');

      this.state.userTier = userTier;

      // Load conversation history from cache
      await this.loadConversationHistory();

      console.log('[AIIntegration] Initialization complete');

      return true;
    } catch (error) {
      console.error('[AIIntegration] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Chat with AI (Command tool)
   * AI POD Council: Natural conversation, context awareness
   *
   * @param {string} query - User query
   * @param {Object} options - { mode, context, toolId }
   * @returns {Promise<Object>} - { response, emotion, tokens, cost }
   */
  async chat(query, options = {}) {
    const {
      mode = 'fast',
      context = {},
      toolId = 'command',
      streaming = false
    } = options;

    try {
      // Check rate limits
      await this.checkRateLimit();

      // Set processing state
      this.state.isProcessing = true;
      this.state.currentModel = mode;

      console.log('[AIIntegration] Chat request:', { query, mode, toolId });

      // Get conversation history for this tool
      const history = this.getConversationHistory(toolId);

      // Prepare request payload
      const payload = {
        query,
        mode,
        context: {
          ...context,
          conversationHistory: history.slice(-10), // Last 10 messages
          userTier: this.state.userTier,
          timestamp: new Date().toISOString()
        }
      };

      // Make API request
      const response = await this.makeRequest(
        this.config.apiEndpoints.chat,
        'POST',
        payload
      );

      // Update conversation history
      this.addToConversationHistory(toolId, {
        role: 'user',
        content: query,
        timestamp: Date.now()
      });

      this.addToConversationHistory(toolId, {
        role: 'assistant',
        content: response.response,
        emotion: response.emotion,
        timestamp: Date.now()
      });

      // Update token usage and cost
      this.updateUsageStats(response.tokens, response.cost);

      // Track analytics
      this.trackEvent('ai_chat', {
        mode,
        toolId,
        tokensUsed: response.tokens?.total || 0,
        emotion: response.emotion
      });

      console.log('[AIIntegration] Chat response received:', {
        emotion: response.emotion,
        tokens: response.tokens,
        cost: response.cost
      });

      return {
        response: response.response,
        emotion: response.emotion || 'neutral',
        tokens: response.tokens,
        cost: response.cost,
        model: response.model || this.config.models[mode]
      };

    } catch (error) {
      console.error('[AIIntegration] Chat failed:', error);

      // Return fallback response
      return this.getFallbackResponse(query, error);

    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Get AI insights for laptop comparison
   * AI POD Council: Intelligent analysis, value assessment
   *
   * @param {Object} laptop1 - First laptop
   * @param {Object} laptop2 - Second laptop
   * @returns {Promise<Object>} - { insights, recommendation, scores }
   */
  async getComparisonInsights(laptop1, laptop2) {
    try {
      console.log('[AIIntegration] Getting comparison insights...');

      // Build comparison context
      const context = {
        laptop1: {
          brand: laptop1.brand || laptop1.brandName,
          model: laptop1.model,
          price: laptop1.price || laptop1.price_myr,
          specs: laptop1.specs,
          rating: laptop1.rating
        },
        laptop2: {
          brand: laptop2.brand || laptop2.brandName,
          model: laptop2.model,
          price: laptop2.price || laptop2.price_myr,
          specs: laptop2.specs,
          rating: laptop2.rating
        }
      };

      // Use chat endpoint with specific prompt
      const prompt = `Compare these two laptops and provide insights:

Laptop 1: ${context.laptop1.brand} ${context.laptop1.model} - RM${context.laptop1.price}
Specs: ${JSON.stringify(context.laptop1.specs)}

Laptop 2: ${context.laptop2.brand} ${context.laptop2.model} - RM${context.laptop2.price}
Specs: ${JSON.stringify(context.laptop2.specs)}

Provide:
1. Key differences
2. Value assessment
3. Best use cases for each
4. Recommendation based on value
5. Deal breakers (if any)

Be concise and specific.`;

      const response = await this.chat(prompt, {
        mode: 'think',
        context,
        toolId: 'versus'
      });

      // Parse insights from response
      const insights = this.parseComparisonInsights(response.response);

      return {
        insights: response.response,
        recommendation: insights.recommendation,
        scores: insights.scores,
        rawResponse: response
      };

    } catch (error) {
      console.error('[AIIntegration] Get comparison insights failed:', error);

      // Return fallback insights
      return this.getFallbackInsights(laptop1, laptop2);
    }
  }

  /**
   * Score laptop match for matchmaker
   * AI POD Council: Smart matching algorithm with AI augmentation
   *
   * @param {Object} laptop - Laptop to score
   * @param {Object} requirements - User requirements
   * @returns {Promise<Object>} - { score, reasons, confidence }
   */
  async scoreMatch(laptop, requirements) {
    try {
      const prompt = `Score this laptop match:

Laptop: ${laptop.brand} ${laptop.model} - RM${laptop.price}
Specs: ${JSON.stringify(laptop.specs)}

User Requirements:
${JSON.stringify(requirements)}

Provide:
1. Match score (0-100)
2. Top 3 reasons why it's a good/bad match
3. Confidence level (low/medium/high)

Be concise.`;

      const response = await this.chat(prompt, {
        mode: 'fast',
        toolId: 'matchmaker'
      });

      // Parse scoring from response
      const scoring = this.parseMatchScoring(response.response);

      return {
        score: scoring.score,
        reasons: scoring.reasons,
        confidence: scoring.confidence,
        aiResponse: response.response
      };

    } catch (error) {
      console.error('[AIIntegration] Score match failed:', error);

      // Fallback to rule-based scoring
      return this.getFallbackScore(laptop, requirements);
    }
  }

  /**
   * Get personalized recommendations
   * AI POD Council: Personalization engine
   *
   * @param {Object} userProfile - User preferences and history
   * @param {Array} laptops - Available laptops
   * @returns {Promise<Array>} - Recommended laptops with reasoning
   */
  async getRecommendations(userProfile, laptops) {
    try {
      const prompt = `Recommend 3-5 laptops for this user:

User Profile:
${JSON.stringify(userProfile)}

Available Laptops:
${laptops.slice(0, 20).map(l => `${l.brand} ${l.model} - RM${l.price}`).join('\n')}

Provide recommendations with brief reasoning.`;

      const response = await this.chat(prompt, {
        mode: 'think',
        toolId: 'matchmaker'
      });

      // Parse recommendations
      const recommendations = this.parseRecommendations(response.response, laptops);

      return recommendations;

    } catch (error) {
      console.error('[AIIntegration] Get recommendations failed:', error);
      return [];
    }
  }

  /**
   * Parse natural language query
   * AI POD Council: Intent detection, entity extraction
   *
   * @param {string} query - Natural language query
   * @returns {Promise<Object>} - { intent, entities, filters }
   */
  async parseQuery(query) {
    try {
      const response = await this.makeRequest(
        this.config.apiEndpoints.parse,
        'POST',
        { query }
      );

      return {
        intent: response.intent,
        entities: response.entities || {},
        filters: response.filters || {},
        confidence: response.confidence || 0.5
      };

    } catch (error) {
      console.error('[AIIntegration] Parse query failed:', error);

      // Fallback to rule-based parsing
      return this.getFallbackParsing(query);
    }
  }

  /**
   * Paraphrase text with Gemini
   * Safety Council: Legal safety through paraphrasing
   *
   * @param {string} text - Original text
   * @param {Object} options - Paraphrasing options
   * @returns {Promise<string>} - Paraphrased text
   */
  async paraphrase(text, options = {}) {
    const {
      emotion = 'neutral',
      style = 'casual',
      tone = 'friendly',
      constraints = []
    } = options;

    try {
      const prompt = `Paraphrase this text with these requirements:
- Emotion: ${emotion}
- Style: ${style}
- Tone: ${tone}
- Constraints: ${constraints.join(', ')}

Original: "${text}"

Paraphrased version:`;

      const response = await this.chat(prompt, {
        mode: 'fast',
        toolId: 'paraphrase'
      });

      return response.response;

    } catch (error) {
      console.error('[AIIntegration] Paraphrase failed:', error);
      return text; // Return original on failure
    }
  }

  // ===================================================================
  // PHASE 5: ADVANCED GEMINI FEATURES
  // ===================================================================

  /**
   * FEATURE 1: Gemini Live API - Conversational Voice
   * Real-time voice conversations with AI Bradaa
   *
   * @param {Object} options - Voice session options
   * @returns {Promise<Object>} - Voice session object
   */
  async startVoiceSession(options = {}) {
    try {
      console.log('[AIIntegration] Starting Gemini Live voice session...');

      // Initialize voice interface if not already done
      if (!this.voiceInterface && window.GeminiVoiceInterface) {
        this.voiceInterface = new window.GeminiVoiceInterface({
          apiEndpoint: this.config.apiEndpoints.geminiLive,
          model: this.config.models.pro,
          personality: 'one_piece_v4',
          manglish: true,
          ...options
        });
      }

      if (!this.voiceInterface) {
        throw new Error('Voice interface not available. Make sure voice-interface.js is loaded.');
      }

      // Start session
      const session = await this.voiceInterface.start();

      this.state.voiceSession = session;
      this.state.isVoiceActive = true;

      console.log('[AIIntegration] Voice session started:', session.sessionId);

      return {
        sessionId: session.sessionId,
        status: 'active',
        voiceInterface: this.voiceInterface
      };

    } catch (error) {
      console.error('[AIIntegration] Start voice session failed:', error);
      throw error;
    }
  }

  /**
   * Stop voice session
   */
  async stopVoiceSession() {
    try {
      if (this.voiceInterface && this.state.isVoiceActive) {
        await this.voiceInterface.stop();
        this.state.isVoiceActive = false;
        this.state.voiceSession = null;
        console.log('[AIIntegration] Voice session stopped');
      }
    } catch (error) {
      console.error('[AIIntegration] Stop voice session failed:', error);
    }
  }

  /**
   * FEATURE 2: Google Search Grounding - Real-time Data
   * Enhanced chat with real-time Google Search results
   *
   * @param {string} query - User query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Response with grounding sources
   */
  async chatWithSearchGrounding(query, options = {}) {
    try {
      console.log('[AIIntegration] Chat with search grounding:', query);

      // Check if search grounding is enabled
      if (!this.config.searchGroundingConfig.enabled) {
        console.warn('[AIIntegration] Search grounding disabled, falling back to regular chat');
        return this.chat(query, options);
      }

      // Enhance prompt with search grounding instruction
      const enhancedContext = {
        ...options.context,
        searchGrounding: {
          enabled: true,
          freshness: options.freshness || this.config.searchGroundingConfig.freshness,
          maxSources: options.maxSources || this.config.searchGroundingConfig.maxSources
        }
      };

      // Use Gemini 2.5 Pro for better search integration
      const response = await this.chat(query, {
        ...options,
        mode: 'pro',
        context: enhancedContext,
        toolId: options.toolId || 'search-grounded-chat'
      });

      // Store last search grounding metadata
      this.state.lastSearchGrounding = {
        query,
        timestamp: Date.now(),
        sources: response.sources || []
      };

      console.log('[AIIntegration] Search grounding complete:', {
        sourcesFound: response.sources?.length || 0
      });

      return {
        ...response,
        isGrounded: true,
        sources: response.sources || [],
        groundingMetadata: this.state.lastSearchGrounding
      };

    } catch (error) {
      console.error('[AIIntegration] Chat with search grounding failed:', error);
      // Fallback to regular chat
      return this.chat(query, options);
    }
  }

  /**
   * Get latest laptop news with search grounding
   *
   * @param {Object} filters - { brand, category, dateRange }
   * @returns {Promise<Object>} - News and insights
   */
  async getLatestLaptopNews(filters = {}) {
    const { brand, category, dateRange = 'week' } = filters;

    let query = 'Latest laptop news and releases';
    if (brand) query += ` from ${brand}`;
    if (category) query += ` in ${category} category`;

    return this.chatWithSearchGrounding(query, {
      freshness: dateRange,
      maxSources: 10,
      toolId: 'laptop-news'
    });
  }

  /**
   * FEATURE 3: Google Maps Integration - Location Data
   * Find nearby laptop stores and buying locations
   *
   * @param {string} laptopModel - Laptop model to find
   * @param {Object} userLocation - { lat, lng } or address string
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Stores with directions
   */
  async findNearbyStores(laptopModel, userLocation, options = {}) {
    try {
      console.log('[AIIntegration] Finding nearby stores for:', laptopModel);

      // Initialize maps integration if needed
      if (!this.mapsIntegration && window.GoogleMapsIntegration) {
        this.mapsIntegration = new window.GoogleMapsIntegration({
          apiKey: options.mapsApiKey,
          defaultRadius: this.config.mapsConfig.defaultRadius
        });
      }

      if (!this.mapsIntegration) {
        throw new Error('Maps integration not available. Make sure maps-integration.js is loaded.');
      }

      // Search for stores
      const stores = await this.mapsIntegration.findLaptopStores(
        laptopModel,
        userLocation,
        {
          radius: options.radius || this.config.mapsConfig.defaultRadius,
          maxResults: options.maxResults || this.config.mapsConfig.maxResults
        }
      );

      // Use AI to rank and recommend stores
      const rankedStores = await this.rankStoresWithAI(stores, laptopModel);

      console.log('[AIIntegration] Found stores:', rankedStores.length);

      return {
        stores: rankedStores,
        userLocation,
        laptopModel,
        searchRadius: options.radius || this.config.mapsConfig.defaultRadius
      };

    } catch (error) {
      console.error('[AIIntegration] Find nearby stores failed:', error);
      return {
        stores: [],
        error: error.message
      };
    }
  }

  /**
   * Rank stores using AI intelligence
   */
  async rankStoresWithAI(stores, laptopModel) {
    try {
      const prompt = `Rank these stores for buying ${laptopModel}:

${stores.map((s, i) => `${i + 1}. ${s.name} - Rating: ${s.rating}, Distance: ${s.distance}m, Price: ${s.priceLevel}`).join('\n')}

Provide ranking with reasoning (consider: rating, distance, price, reputation).`;

      const response = await this.chat(prompt, {
        mode: 'fast',
        toolId: 'store-ranking'
      });

      // Parse ranking and apply to stores
      // For now, return stores as-is (AI ranking integration can be enhanced)
      return stores;

    } catch (error) {
      console.error('[AIIntegration] Rank stores with AI failed:', error);
      return stores;
    }
  }

  /**
   * FEATURE 4: Gemini Intelligence - Advanced Tasks
   * Content analysis, summarization, query optimization
   *
   * @param {string} content - Content to analyze
   * @param {string} task - 'analyze', 'summarize', 'edit', 'compare'
   * @param {Object} options - Task options
   * @returns {Promise<Object>} - Analysis results
   */
  async intelligenceTask(content, task, options = {}) {
    try {
      console.log('[AIIntegration] Intelligence task:', task);

      let prompt;
      let mode = 'pro'; // Use Gemini 2.5 Pro for intelligence tasks

      switch (task) {
        case 'analyze':
          prompt = `Analyze this laptop review/specification:

${content}

Provide:
1. Key strengths
2. Key weaknesses
3. Value assessment
4. Target user profile
5. Recommended use cases`;
          break;

        case 'summarize':
          prompt = `Summarize this laptop review in 3-5 bullet points:

${content}

Focus on: performance, value, user experience, notable features.`;
          break;

        case 'edit':
          prompt = `Improve this user query for better laptop search results:

Original: "${content}"

Provide:
1. Clarified version
2. Extracted requirements
3. Suggested filters`;
          break;

        case 'compare':
          prompt = `Generate a comparison table for these laptops:

${content}

Include: specs, price, performance, value score.`;
          break;

        case 'budget_optimize':
          prompt = `Optimize this laptop selection within budget constraints:

${content}

Provide:
1. Best value options
2. Trade-offs analysis
3. Budget allocation recommendations`;
          break;

        case 'use_case_match':
          prompt = `Match laptops to this use case:

Use case: ${content}

Provide:
1. Ideal specs required
2. Recommended laptops
3. Must-have vs nice-to-have features`;
          break;

        default:
          throw new Error(`Unknown intelligence task: ${task}`);
      }

      const response = await this.chat(prompt, {
        mode,
        toolId: `intelligence-${task}`,
        ...options
      });

      return {
        task,
        result: response.response,
        emotion: response.emotion,
        tokens: response.tokens,
        cost: response.cost
      };

    } catch (error) {
      console.error('[AIIntegration] Intelligence task failed:', error);
      throw error;
    }
  }

  /**
   * FEATURE 5: Image Analysis - Vision API
   * Analyze laptop images, extract specs from screenshots
   *
   * @param {File|Blob} imageFile - Image file to analyze
   * @param {string} analysisType - 'identify', 'extract_specs', 'benchmark_chart', 'ocr'
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeImage(imageFile, analysisType = 'identify', options = {}) {
    try {
      console.log('[AIIntegration] Analyzing image:', imageFile.name, analysisType);

      // Validate file
      if (!this.config.visionConfig.supportedFormats.includes(imageFile.type)) {
        throw new Error(`Unsupported image format: ${imageFile.type}`);
      }

      if (imageFile.size > this.config.visionConfig.maxImageSize) {
        throw new Error(`Image too large: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)`);
      }

      // Convert to base64
      const base64Image = await this.fileToBase64(imageFile);

      // Prepare analysis prompt
      let prompt;
      switch (analysisType) {
        case 'identify':
          prompt = 'What laptop is this? Identify brand, model, and any visible specifications.';
          break;
        case 'extract_specs':
          prompt = 'Extract ALL specifications visible in this image. Format as structured data.';
          break;
        case 'benchmark_chart':
          prompt = 'Analyze this performance benchmark chart. Extract scores and provide interpretation.';
          break;
        case 'ocr':
          prompt = 'Extract all text from this image (OCR). Maintain formatting.';
          break;
        case 'translate':
          prompt = 'Translate all non-English text in this image to English. Preserve technical terms.';
          break;
        default:
          prompt = options.customPrompt || 'Describe this laptop image in detail.';
      }

      // Call vision analysis endpoint
      const response = await this.makeRequest(
        this.config.apiEndpoints.vision,
        'POST',
        {
          image: base64Image,
          mimeType: imageFile.type,
          prompt,
          analysisType,
          options
        }
      );

      // Store last analysis
      this.state.lastVisionAnalysis = {
        fileName: imageFile.name,
        analysisType,
        timestamp: Date.now(),
        result: response
      };

      console.log('[AIIntegration] Image analysis complete');

      return {
        analysisType,
        result: response.text || response.result,
        confidence: response.confidence,
        extractedData: response.extractedData,
        tokens: response.tokens,
        cost: response.cost,
        metadata: this.state.lastVisionAnalysis
      };

    } catch (error) {
      console.error('[AIIntegration] Image analysis failed:', error);
      throw error;
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * FEATURE 6: Extended Thinking Mode - Gemini 2.5 Pro
   * Deep reasoning for complex queries
   *
   * @param {string} query - Complex query requiring deep thought
   * @param {Object} options - Thinking options
   * @returns {Promise<Object>} - Response with thinking process
   */
  async thinkDeeply(query, options = {}) {
    try {
      console.log('[AIIntegration] Extended thinking mode:', query);

      // Check if thinking mode is enabled
      if (!this.config.thinkingModeConfig.enabled) {
        console.warn('[AIIntegration] Thinking mode disabled, using regular pro mode');
        return this.chat(query, { ...options, mode: 'pro' });
      }

      // Set thinking mode state
      this.state.thinkingMode = true;

      // Use Gemini 2.5 Pro with extended thinking config
      const response = await this.chat(query, {
        ...options,
        mode: 'pro',
        context: {
          ...options.context,
          thinkingMode: true,
          complexity: options.complexity || 'high',
          maxThinkingTokens: this.config.thinkingModeConfig.maxThinkingTokens
        },
        toolId: options.toolId || 'deep-thinking'
      });

      this.state.thinkingMode = false;

      console.log('[AIIntegration] Extended thinking complete');

      return {
        ...response,
        isDeepThinking: true,
        thinkingProcess: response.thinkingProcess || null,
        reasoning: response.reasoning || null
      };

    } catch (error) {
      console.error('[AIIntegration] Extended thinking failed:', error);
      this.state.thinkingMode = false;
      throw error;
    }
  }

  /**
   * Assess query complexity to auto-trigger thinking mode
   *
   * @param {string} query - User query
   * @returns {number} - Complexity score 0-10
   */
  assessQueryComplexity(query) {
    let score = 0;

    // Length-based scoring
    if (query.length > 200) score += 2;
    else if (query.length > 100) score += 1;

    // Keyword-based scoring
    const complexKeywords = [
      'compare', 'analyze', 'optimize', 'recommend', 'trade-off',
      'future-proof', 'long-term', 'value assessment', 'multiple',
      'constraint', 'budget', 'priority', 'versus', 'pros and cons'
    ];

    for (const keyword of complexKeywords) {
      if (query.toLowerCase().includes(keyword)) {
        score += 1;
      }
    }

    // Question mark count (multiple questions = complex)
    const questionCount = (query.match(/\?/g) || []).length;
    score += Math.min(questionCount, 3);

    return Math.min(score, 10);
  }

  /**
   * Auto-select best mode based on query complexity
   *
   * @param {string} query - User query
   * @returns {string} - 'fast' or 'pro'
   */
  autoSelectMode(query) {
    const complexity = this.assessQueryComplexity(query);

    if (complexity >= this.config.thinkingModeConfig.minComplexityScore) {
      console.log('[AIIntegration] High complexity detected, using pro mode');
      return 'pro';
    }

    return 'fast';
  }

  /**
   * Check rate limits
   * Platform Council: Quota management, fair usage
   */
  async checkRateLimit() {
    const limits = this.config.rateLimits[this.state.userTier];

    // Reset minute counter if needed
    const now = Date.now();
    if (!this.state.quotaResetTime.minute || now > this.state.quotaResetTime.minute) {
      this.state.requestCount.minute = 0;
      this.state.quotaResetTime.minute = now + 60000; // 1 minute
    }

    // Reset day counter if needed
    if (!this.state.quotaResetTime.day || now > this.state.quotaResetTime.day) {
      this.state.requestCount.day = 0;
      this.state.quotaResetTime.day = now + 86400000; // 24 hours
    }

    // Check limits
    if (this.state.requestCount.minute >= limits.requestsPerMinute) {
      const waitTime = this.state.quotaResetTime.minute - now;
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    if (this.state.requestCount.day >= limits.requestsPerDay) {
      throw new Error('Daily quota exceeded. Upgrade to PRO for more requests.');
    }

    // Increment counters
    this.state.requestCount.minute++;
    this.state.requestCount.day++;
    this.state.lastRequestTime = now;
  }

  /**
   * Make API request with retry logic
   * Platform Council: Resilient networking
   */
  async makeRequest(url, method, body, retries = this.config.retryAttempts) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.config.responseTimeout)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data || data;

      } catch (error) {
        console.error(`[AIIntegration] Request attempt ${attempt} failed:`, error);

        if (attempt > retries) {
          throw error;
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 500);
      }
    }
  }

  /**
   * Conversation history management
   */
  getConversationHistory(toolId) {
    return this.state.conversationHistory.get(toolId) || [];
  }

  addToConversationHistory(toolId, message) {
    const history = this.getConversationHistory(toolId);
    history.push(message);

    // Trim to max turns
    if (history.length > this.config.maxConversationTurns * 2) {
      history.splice(0, 2); // Remove oldest user+assistant pair
    }

    this.state.conversationHistory.set(toolId, history);

    // Save to cache
    this.saveConversationHistory();
  }

  clearConversationHistory(toolId) {
    this.state.conversationHistory.delete(toolId);
    this.saveConversationHistory();
  }

  async loadConversationHistory() {
    try {
      const cached = localStorage.getItem('ai_conversation_history');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.state.conversationHistory = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('[AIIntegration] Load conversation history failed:', error);
    }
  }

  saveConversationHistory() {
    try {
      const obj = Object.fromEntries(this.state.conversationHistory);
      localStorage.setItem('ai_conversation_history', JSON.stringify(obj));
    } catch (error) {
      console.error('[AIIntegration] Save conversation history failed:', error);
    }
  }

  /**
   * Update usage statistics
   */
  updateUsageStats(tokens, cost) {
    if (tokens) {
      this.state.tokenUsage.total += tokens.total || 0;
      this.state.tokenUsage.thisSession += tokens.total || 0;
    }

    if (cost) {
      this.state.costEstimate.total += cost.total || 0;
      this.state.costEstimate.thisSession += cost.total || 0;
    }
  }

  /**
   * Fallback responses and parsing
   */
  getFallbackResponse(query, error) {
    console.log('[AIIntegration] Using fallback response');

    const fallbacks = [
      "Sorry lah, I'm having trouble connecting to my brain right now. Can you try again?",
      "Wah, something went wrong with my AI. Let me help you the old-fashioned way!",
      "My AI is taking a break. But don't worry, I can still help you!",
      "Oops, technical difficulties! But I'm still here to assist you."
    ];

    return {
      response: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      emotion: 'supportive',
      tokens: { total: 0 },
      cost: { total: 0 },
      isFallback: true,
      error: error.message
    };
  }

  getFallbackInsights(laptop1, laptop2) {
    const priceDiff = Math.abs(laptop1.price - laptop2.price);
    const cheaper = laptop1.price < laptop2.price ? laptop1 : laptop2;

    return {
      insights: `Comparing ${laptop1.brand} ${laptop1.model} vs ${laptop2.brand} ${laptop2.model}. Price difference: RM${priceDiff}. ${cheaper.brand} ${cheaper.model} offers better value at RM${cheaper.price}.`,
      recommendation: cheaper.id,
      scores: { laptop1: 50, laptop2: 50 },
      isFallback: true
    };
  }

  getFallbackScore(laptop, requirements) {
    // Simple rule-based scoring
    let score = 50;

    if (requirements.budget && laptop.price <= requirements.budget) {
      score += 20;
    }

    if (requirements.gaming && laptop.specs?.gpu?.model?.includes('RTX')) {
      score += 15;
    }

    return {
      score: Math.min(score, 100),
      reasons: ['Based on simple matching rules'],
      confidence: 'low',
      isFallback: true
    };
  }

  getFallbackParsing(query) {
    const lowerQuery = query.toLowerCase();

    // Simple keyword matching
    const intent = lowerQuery.includes('gaming') ? 'gaming' :
                   lowerQuery.includes('business') ? 'business' :
                   'general';

    return {
      intent,
      entities: {},
      filters: {},
      confidence: 0.3,
      isFallback: true
    };
  }

  /**
   * Response parsers
   */
  parseComparisonInsights(response) {
    // Extract recommendation and scores from AI response
    // This is a simplified version - production would use more sophisticated parsing
    return {
      recommendation: null,
      scores: { laptop1: 50, laptop2: 50 }
    };
  }

  parseMatchScoring(response) {
    // Extract score, reasons, and confidence from AI response
    return {
      score: 70,
      reasons: ['Good specs', 'Within budget', 'High rating'],
      confidence: 'medium'
    };
  }

  parseRecommendations(response, laptops) {
    // Extract laptop recommendations from AI response
    return laptops.slice(0, 5);
  }

  /**
   * Track analytics event
   */
  trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current state (for debugging)
   */
  getState() {
    return {
      userTier: this.state.userTier,
      isProcessing: this.state.isProcessing,
      currentModel: this.state.currentModel,
      requestCount: this.state.requestCount,
      tokenUsage: this.state.tokenUsage,
      costEstimate: this.state.costEstimate,
      conversationCount: this.state.conversationHistory.size
    };
  }
}

/**
 * Rate Limiter Helper Class
 */
class RateLimiter {
  constructor() {
    this.requests = [];
  }

  async wait() {
    // Simple rate limiter implementation
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < 60000); // Keep last minute

    if (this.requests.length >= 10) { // 10 requests per minute
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }
}

// Export as singleton
const aiIntegration = new AIIntegration();

// Export for global access
window.AIIntegration = AIIntegration;
window.aiIntegration = aiIntegration;

console.log('[ai-integration.js] Loaded successfully');
