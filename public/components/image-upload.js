/**
 * Image Upload Component
 * AI Bradaa - Phase 5: Vision API Interface
 *
 * FEATURES:
 * - Drag-and-drop image upload
 * - File picker support
 * - Image preview
 * - Analysis type selection
 * - Real-time analysis results
 * - Loading states and progress
 * - Error handling
 *
 * SUPPORTED ANALYSIS TYPES:
 * - identify: Identify laptop brand/model
 * - extract_specs: Extract specifications
 * - benchmark_chart: Analyze benchmark charts
 * - ocr: Extract all text (OCR)
 * - translate: Translate non-English text
 *
 * 84-Mentor Standards:
 * - Customer: Intuitive UI, clear feedback
 * - Platform: File validation, error recovery
 * - Safety: Privacy protection, no upload storage
 * - AI POD: Accurate vision analysis
 */

class ImageUploadComponent {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.config = {
      maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB
      supportedFormats: options.supportedFormats || ['image/jpeg', 'image/png', 'image/webp'],
      analysisTypes: options.analysisTypes || [
        { value: 'identify', label: 'Identify Laptop' },
        { value: 'extract_specs', label: 'Extract Specifications' },
        { value: 'benchmark_chart', label: 'Analyze Benchmark Chart' },
        { value: 'ocr', label: 'Extract Text (OCR)' },
        { value: 'translate', label: 'Translate Text' }
      ],
      defaultAnalysisType: options.defaultAnalysisType || 'identify',
      showPreview: options.showPreview !== false,
      autoAnalyze: options.autoAnalyze !== false
    };

    this.state = {
      selectedFile: null,
      previewUrl: null,
      analysisType: this.config.defaultAnalysisType,
      isAnalyzing: false,
      analysisResult: null,
      error: null
    };

    this.callbacks = {
      onFileSelect: options.onFileSelect || (() => {}),
      onAnalysisStart: options.onAnalysisStart || (() => {}),
      onAnalysisComplete: options.onAnalysisComplete || (() => {}),
      onError: options.onError || (() => {})
    };

    // Initialize
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render component
   */
  render() {
    this.container.innerHTML = `
      <div class="image-upload-component">
        <div class="upload-area" id="uploadArea">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p class="upload-text">
            <strong>Drop an image here</strong> or click to browse
          </p>
          <p class="upload-hint">
            Supports JPG, PNG, WebP (max 5MB)
          </p>
          <input type="file" id="fileInput" accept=".jpg,.jpeg,.png,.webp" hidden />
        </div>

        <div class="analysis-options">
          <label for="analysisType">Analysis Type:</label>
          <select id="analysisType" class="analysis-select">
            ${this.config.analysisTypes.map(type =>
              `<option value="${type.value}" ${type.value === this.config.defaultAnalysisType ? 'selected' : ''}>
                ${type.label}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="preview-area" id="previewArea" style="display: none;">
          <img id="imagePreview" alt="Preview" />
          <div class="preview-actions">
            <button id="analyzeButton" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Analyze Image
            </button>
            <button id="removeButton" class="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Remove
            </button>
          </div>
        </div>

        <div class="loading-area" id="loadingArea" style="display: none;">
          <div class="spinner"></div>
          <p>Analyzing image with Gemini Vision...</p>
        </div>

        <div class="result-area" id="resultArea" style="display: none;">
          <h3>Analysis Results</h3>
          <div id="resultContent" class="result-content"></div>
          <div class="result-actions">
            <button id="analyzeAgainButton" class="btn btn-secondary">Analyze Again</button>
            <button id="copyResultButton" class="btn btn-secondary">Copy Results</button>
          </div>
        </div>

        <div class="error-area" id="errorArea" style="display: none;">
          <div class="error-icon">⚠️</div>
          <p id="errorMessage"></p>
          <button id="retryButton" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `;

    this.addStyles();
  }

  /**
   * Add component styles
   */
  addStyles() {
    if (document.getElementById('image-upload-styles')) return;

    const style = document.createElement('style');
    style.id = 'image-upload-styles';
    style.textContent = `
      .image-upload-component {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }

      .upload-area {
        border: 2px dashed var(--color-border, #ccc);
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: var(--color-surface, #f9f9f9);
      }

      .upload-area:hover,
      .upload-area.drag-over {
        border-color: var(--color-primary, #007bff);
        background: var(--color-surface-hover, #f0f0f0);
      }

      .upload-icon {
        color: var(--color-text-secondary, #666);
        margin-bottom: 16px;
      }

      .upload-text {
        margin: 0 0 8px 0;
        color: var(--color-text, #333);
      }

      .upload-hint {
        margin: 0;
        font-size: 14px;
        color: var(--color-text-secondary, #666);
      }

      .analysis-options {
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .analysis-select {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--color-border, #ccc);
        border-radius: 6px;
        font-size: 14px;
        background: white;
      }

      .preview-area {
        margin: 20px 0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .preview-area img {
        width: 100%;
        height: auto;
        display: block;
      }

      .preview-actions {
        padding: 16px;
        display: flex;
        gap: 12px;
        background: var(--color-surface, #f9f9f9);
      }

      .loading-area {
        text-align: center;
        padding: 40px;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--color-border, #ccc);
        border-top-color: var(--color-primary, #007bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .result-area {
        margin: 20px 0;
        padding: 20px;
        border-radius: 12px;
        background: var(--color-surface, #f9f9f9);
      }

      .result-area h3 {
        margin: 0 0 16px 0;
      }

      .result-content {
        margin: 0 0 16px 0;
        padding: 16px;
        background: white;
        border-radius: 8px;
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.6;
      }

      .result-actions {
        display: flex;
        gap: 12px;
      }

      .error-area {
        text-align: center;
        padding: 40px;
        color: var(--color-error, #dc3545);
      }

      .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: var(--color-primary, #007bff);
        color: white;
      }

      .btn-primary:hover {
        background: var(--color-primary-dark, #0056b3);
      }

      .btn-secondary {
        background: var(--color-secondary, #6c757d);
        color: white;
      }

      .btn-secondary:hover {
        background: var(--color-secondary-dark, #545b62);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Upload area click
    const uploadArea = this.container.querySelector('#uploadArea');
    const fileInput = this.container.querySelector('#fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    // Analysis type change
    const analysisSelect = this.container.querySelector('#analysisType');
    analysisSelect.addEventListener('change', (e) => {
      this.state.analysisType = e.target.value;
    });

    // Analyze button
    const analyzeButton = this.container.querySelector('#analyzeButton');
    if (analyzeButton) {
      analyzeButton.addEventListener('click', () => this.analyzeImage());
    }

    // Remove button
    const removeButton = this.container.querySelector('#removeButton');
    if (removeButton) {
      removeButton.addEventListener('click', () => this.reset());
    }

    // Retry button
    const retryButton = this.container.querySelector('#retryButton');
    if (retryButton) {
      retryButton.addEventListener('click', () => this.reset());
    }

    // Analyze again button
    const analyzeAgainButton = this.container.querySelector('#analyzeAgainButton');
    if (analyzeAgainButton) {
      analyzeAgainButton.addEventListener('click', () => this.showPreview());
    }

    // Copy result button
    const copyResultButton = this.container.querySelector('#copyResultButton');
    if (copyResultButton) {
      copyResultButton.addEventListener('click', () => this.copyResults());
    }
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(file) {
    try {
      // Validate file
      this.validateFile(file);

      // Update state
      this.state.selectedFile = file;
      this.state.error = null;

      // Create preview
      this.state.previewUrl = URL.createObjectURL(file);

      // Show preview
      this.showPreview();

      // Callback
      this.callbacks.onFileSelect(file);

      // Auto-analyze if enabled
      if (this.config.autoAnalyze) {
        await this.analyzeImage();
      }

    } catch (error) {
      this.showError(error.message);
      this.callbacks.onError(error);
    }
  }

  /**
   * Validate file
   */
  validateFile(file) {
    // Check file type
    if (!this.config.supportedFormats.includes(file.type)) {
      throw new Error(`Unsupported file format: ${file.type}. Please use JPG, PNG, or WebP.`);
    }

    // Check file size
    if (file.size > this.config.maxFileSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      throw new Error(`File too large: ${sizeMB}MB. Maximum size is 5MB.`);
    }
  }

  /**
   * Show preview
   */
  showPreview() {
    const uploadArea = this.container.querySelector('#uploadArea');
    const previewArea = this.container.querySelector('#previewArea');
    const imagePreview = this.container.querySelector('#imagePreview');
    const resultArea = this.container.querySelector('#resultArea');
    const errorArea = this.container.querySelector('#errorArea');

    uploadArea.style.display = 'none';
    previewArea.style.display = 'block';
    resultArea.style.display = 'none';
    errorArea.style.display = 'none';

    imagePreview.src = this.state.previewUrl;
  }

  /**
   * Analyze image
   */
  async analyzeImage() {
    try {
      if (!this.state.selectedFile) {
        throw new Error('No file selected');
      }

      // Show loading
      this.showLoading();

      // Callback
      this.callbacks.onAnalysisStart({
        file: this.state.selectedFile,
        analysisType: this.state.analysisType
      });

      // Use AI integration
      if (!window.aiIntegration) {
        throw new Error('AI Integration not available');
      }

      // Analyze with Gemini Vision
      const result = await window.aiIntegration.analyzeImage(
        this.state.selectedFile,
        this.state.analysisType
      );

      // Update state
      this.state.analysisResult = result;

      // Show results
      this.showResults(result);

      // Callback
      this.callbacks.onAnalysisComplete(result);

    } catch (error) {
      console.error('[ImageUpload] Analysis failed:', error);
      this.showError(error.message);
      this.callbacks.onError(error);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    const previewArea = this.container.querySelector('#previewArea');
    const loadingArea = this.container.querySelector('#loadingArea');
    const resultArea = this.container.querySelector('#resultArea');
    const errorArea = this.container.querySelector('#errorArea');

    previewArea.style.display = 'none';
    loadingArea.style.display = 'block';
    resultArea.style.display = 'none';
    errorArea.style.display = 'none';

    this.state.isAnalyzing = true;
  }

  /**
   * Show results
   */
  showResults(result) {
    const loadingArea = this.container.querySelector('#loadingArea');
    const resultArea = this.container.querySelector('#resultArea');
    const resultContent = this.container.querySelector('#resultContent');

    loadingArea.style.display = 'none';
    resultArea.style.display = 'block';

    // Format result
    let formattedResult = result.result;

    if (result.extractedData) {
      formattedResult += '\n\n=== Extracted Data ===\n';
      formattedResult += JSON.stringify(result.extractedData, null, 2);
    }

    if (result.confidence) {
      formattedResult += `\n\nConfidence: ${(result.confidence * 100).toFixed(1)}%`;
    }

    if (result.tokens) {
      formattedResult += `\nTokens: ${result.tokens.total}`;
    }

    if (result.cost) {
      formattedResult += `\nCost: RM${result.cost.myr.toFixed(4)}`;
    }

    resultContent.textContent = formattedResult;

    this.state.isAnalyzing = false;
  }

  /**
   * Show error
   */
  showError(message) {
    const uploadArea = this.container.querySelector('#uploadArea');
    const previewArea = this.container.querySelector('#previewArea');
    const loadingArea = this.container.querySelector('#loadingArea');
    const resultArea = this.container.querySelector('#resultArea');
    const errorArea = this.container.querySelector('#errorArea');
    const errorMessage = this.container.querySelector('#errorMessage');

    uploadArea.style.display = 'none';
    previewArea.style.display = 'none';
    loadingArea.style.display = 'none';
    resultArea.style.display = 'none';
    errorArea.style.display = 'block';

    errorMessage.textContent = message;

    this.state.error = message;
    this.state.isAnalyzing = false;
  }

  /**
   * Copy results to clipboard
   */
  async copyResults() {
    try {
      if (!this.state.analysisResult) return;

      await navigator.clipboard.writeText(this.state.analysisResult.result);

      // Show feedback
      const copyButton = this.container.querySelector('#copyResultButton');
      const originalText = copyButton.textContent;
      copyButton.textContent = '✓ Copied!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);

    } catch (error) {
      console.error('[ImageUpload] Copy failed:', error);
    }
  }

  /**
   * Reset component
   */
  reset() {
    // Clean up preview URL
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }

    // Reset state
    this.state = {
      selectedFile: null,
      previewUrl: null,
      analysisType: this.config.defaultAnalysisType,
      isAnalyzing: false,
      analysisResult: null,
      error: null
    };

    // Reset UI
    const uploadArea = this.container.querySelector('#uploadArea');
    const previewArea = this.container.querySelector('#previewArea');
    const loadingArea = this.container.querySelector('#loadingArea');
    const resultArea = this.container.querySelector('#resultArea');
    const errorArea = this.container.querySelector('#errorArea');
    const fileInput = this.container.querySelector('#fileInput');

    uploadArea.style.display = 'block';
    previewArea.style.display = 'none';
    loadingArea.style.display = 'none';
    resultArea.style.display = 'none';
    errorArea.style.display = 'none';

    fileInput.value = '';
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Destroy component
   */
  destroy() {
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }

    this.container.innerHTML = '';
  }
}

// Export to global scope
window.ImageUploadComponent = ImageUploadComponent;

console.log('[image-upload.js] Loaded successfully');
