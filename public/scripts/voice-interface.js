/**
 * Gemini Live Voice Interface
 * AI Bradaa - Phase 5: Conversational Voice Feature
 *
 * FEATURES:
 * - Real-time voice input/output with Gemini Live API
 * - WebSocket audio streaming
 * - Voice activity detection (VAD)
 * - One Piece v4.0 personality in voice
 * - Manglish pronunciation support
 * - Voice interruption and turn-taking
 * - Mute, volume controls
 *
 * ARCHITECTURE:
 * - Web Audio API for audio processing
 * - MediaRecorder API for voice capture
 * - WebSocket for bi-directional streaming
 * - AudioContext for playback
 *
 * 84-Mentor Standards:
 * - AI POD: Voice personality, natural conversation
 * - Platform: Streaming optimization, error recovery
 * - Safety: Privacy protection, consent management
 * - Customer: Low latency, high quality audio
 */

class GeminiVoiceInterface {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: options.apiEndpoint || '/.netlify/functions/gemini-live',
      model: options.model || 'gemini-2.5-pro',
      personality: options.personality || 'one_piece_v4',
      manglish: options.manglish !== false, // enabled by default

      // Audio config
      sampleRate: options.sampleRate || 16000, // 16kHz for optimal streaming
      channels: options.channels || 1, // mono
      bitsPerSample: 16,

      // Voice activity detection
      vadEnabled: options.vadEnabled !== false,
      vadThreshold: options.vadThreshold || 0.01, // amplitude threshold
      vadSilenceDuration: options.vadSilenceDuration || 1500, // ms of silence to trigger end

      // Streaming
      chunkDuration: options.chunkDuration || 100, // ms
      bufferSize: options.bufferSize || 4096,

      // Voice controls
      autoGainControl: true,
      noiseSuppression: true,
      echoCancellation: true
    };

    this.state = {
      isActive: false,
      isRecording: false,
      isPlaying: false,
      isMuted: false,
      volume: options.volume || 1.0,
      sessionId: null,
      connectionState: 'disconnected' // disconnected, connecting, connected, error
    };

    // Audio components
    this.audioContext = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioWorklet = null;
    this.gainNode = null;

    // WebSocket
    this.ws = null;

    // VAD state
    this.vadState = {
      isSpeaking: false,
      silenceStart: null,
      lastSpeakTime: null
    };

    // Callbacks
    this.callbacks = {
      onSessionStart: options.onSessionStart || (() => {}),
      onSessionEnd: options.onSessionEnd || (() => {}),
      onTranscript: options.onTranscript || (() => {}),
      onResponse: options.onResponse || (() => {}),
      onError: options.onError || (err => console.error('[Voice]', err)),
      onStateChange: options.onStateChange || (() => {})
    };
  }

  /**
   * Start voice session
   */
  async start() {
    try {
      console.log('[VoiceInterface] Starting session...');

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          autoGainControl: this.config.autoGainControl,
          noiseSuppression: this.config.noiseSuppression,
          echoCancellation: this.config.echoCancellation
        }
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.state.volume;
      this.gainNode.connect(this.audioContext.destination);

      // Connect to Gemini Live API via WebSocket
      await this.connectWebSocket();

      // Start recording
      await this.startRecording();

      this.state.isActive = true;
      this.state.sessionId = this.generateSessionId();

      this.updateState('connected');
      this.callbacks.onSessionStart({ sessionId: this.state.sessionId });

      console.log('[VoiceInterface] Session started:', this.state.sessionId);

      return {
        sessionId: this.state.sessionId,
        status: 'active'
      };

    } catch (error) {
      console.error('[VoiceInterface] Start failed:', error);
      this.updateState('error');
      this.callbacks.onError(error);
      throw error;
    }
  }

  /**
   * Stop voice session
   */
  async stop() {
    try {
      console.log('[VoiceInterface] Stopping session...');

      // Stop recording
      if (this.mediaRecorder && this.state.isRecording) {
        this.mediaRecorder.stop();
        this.state.isRecording = false;
      }

      // Close WebSocket
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // Release media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // Close audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.state.isActive = false;
      this.updateState('disconnected');
      this.callbacks.onSessionEnd({ sessionId: this.state.sessionId });

      console.log('[VoiceInterface] Session stopped');

    } catch (error) {
      console.error('[VoiceInterface] Stop failed:', error);
      this.callbacks.onError(error);
    }
  }

  /**
   * Connect to Gemini Live WebSocket
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        // Determine WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}${this.config.apiEndpoint}`;

        console.log('[VoiceInterface] Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('[VoiceInterface] WebSocket connected');

          // Send initialization message
          this.ws.send(JSON.stringify({
            type: 'init',
            config: {
              model: this.config.model,
              personality: this.config.personality,
              manglish: this.config.manglish,
              sampleRate: this.config.sampleRate
            }
          }));

          this.updateState('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('[VoiceInterface] WebSocket error:', error);
          this.updateState('error');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[VoiceInterface] WebSocket closed');
          this.updateState('disconnected');
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(event) {
    try {
      if (event.data instanceof ArrayBuffer) {
        // Audio data from Gemini
        this.playAudioChunk(event.data);
      } else {
        // JSON message
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'transcript':
            this.callbacks.onTranscript(message.data);
            break;

          case 'response':
            this.callbacks.onResponse(message.data);
            break;

          case 'error':
            this.callbacks.onError(new Error(message.error));
            break;

          case 'session_started':
            console.log('[VoiceInterface] Session confirmed:', message.sessionId);
            break;

          default:
            console.log('[VoiceInterface] Unknown message type:', message.type);
        }
      }
    } catch (error) {
      console.error('[VoiceInterface] Message handling failed:', error);
    }
  }

  /**
   * Start recording audio
   */
  async startRecording() {
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: this.config.sampleRate * this.config.bitsPerSample
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Voice activity detection
          if (this.config.vadEnabled) {
            this.processVAD(event.data);
          } else {
            // Send audio directly
            this.sendAudioChunk(event.data);
          }
        }
      };

      this.mediaRecorder.start(this.config.chunkDuration);
      this.state.isRecording = true;

      console.log('[VoiceInterface] Recording started');

    } catch (error) {
      console.error('[VoiceInterface] Start recording failed:', error);
      throw error;
    }
  }

  /**
   * Process voice activity detection
   */
  async processVAD(audioBlob) {
    try {
      // Convert blob to audio buffer for analysis
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Calculate RMS amplitude
      const channelData = audioBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);

      const isSpeaking = rms > this.config.vadThreshold;
      const now = Date.now();

      if (isSpeaking) {
        // Speech detected
        if (!this.vadState.isSpeaking) {
          console.log('[VoiceInterface] Speech started');
          this.vadState.isSpeaking = true;
        }

        this.vadState.lastSpeakTime = now;
        this.vadState.silenceStart = null;

        // Send audio chunk
        this.sendAudioChunk(audioBlob);

      } else {
        // Silence detected
        if (this.vadState.isSpeaking) {
          // Start silence timer
          if (!this.vadState.silenceStart) {
            this.vadState.silenceStart = now;
          }

          // Check if silence duration exceeded
          const silenceDuration = now - this.vadState.silenceStart;
          if (silenceDuration > this.config.vadSilenceDuration) {
            console.log('[VoiceInterface] Speech ended (silence detected)');
            this.vadState.isSpeaking = false;
            this.vadState.silenceStart = null;

            // Signal end of speech
            this.sendEndOfSpeech();
          }
        }
      }

    } catch (error) {
      console.error('[VoiceInterface] VAD processing failed:', error);
      // Fallback: send audio anyway
      this.sendAudioChunk(audioBlob);
    }
  }

  /**
   * Send audio chunk to Gemini Live API
   */
  async sendAudioChunk(audioBlob) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.state.isMuted) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        this.ws.send(arrayBuffer);
      }
    } catch (error) {
      console.error('[VoiceInterface] Send audio chunk failed:', error);
    }
  }

  /**
   * Send end of speech signal
   */
  sendEndOfSpeech() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_of_speech' }));
    }
  }

  /**
   * Play audio response from Gemini
   */
  async playAudioChunk(arrayBuffer) {
    try {
      if (!this.audioContext) return;

      this.state.isPlaying = true;

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      source.onended = () => {
        this.state.isPlaying = false;
      };

      // Play audio
      source.start();

    } catch (error) {
      console.error('[VoiceInterface] Play audio failed:', error);
      this.state.isPlaying = false;
    }
  }

  /**
   * Mute/unmute microphone
   */
  setMuted(muted) {
    this.state.isMuted = muted;

    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }

    console.log('[VoiceInterface] Mute:', muted);
  }

  /**
   * Set volume
   */
  setVolume(volume) {
    this.state.volume = Math.max(0, Math.min(1, volume));

    if (this.gainNode) {
      this.gainNode.gain.value = this.state.volume;
    }

    console.log('[VoiceInterface] Volume:', this.state.volume);
  }

  /**
   * Update connection state
   */
  updateState(state) {
    this.state.connectionState = state;
    this.callbacks.onStateChange({
      state,
      isActive: this.state.isActive,
      isRecording: this.state.isRecording,
      isPlaying: this.state.isPlaying,
      isMuted: this.state.isMuted
    });
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Check if browser supports required features
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      (window.AudioContext || window.webkitAudioContext) &&
      window.MediaRecorder &&
      window.WebSocket
    );
  }
}

// Export to global scope
window.GeminiVoiceInterface = GeminiVoiceInterface;

console.log('[voice-interface.js] Loaded successfully');
console.log('[voice-interface.js] Browser support:', GeminiVoiceInterface.isSupported());
