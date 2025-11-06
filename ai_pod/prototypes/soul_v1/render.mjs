/**
 * Souls v1 - Renderer
 * Visual rendering of soul states using canvas and Lottie
 */

import { SoulStates } from './fsm.mjs';

/**
 * Soul Renderer
 */
export class SoulRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.lottiePlayer = null;
    this.currentAnimation = null;
    this.renderMode = options.renderMode || 'canvas'; // 'canvas' or 'lottie'
    this.size = options.size || 120;

    this.animations = {
      [SoulStates.NEUTRAL]: '/assets/animations/soul-neutral.json',
      [SoulStates.AMBER]: null, // Canvas only for now
      [SoulStates.GREEN]: null,
      [SoulStates.RED]: null,
    };

    this.init();
  }

  /**
   * Initialize renderer
   */
  init() {
    if (this.renderMode === 'canvas') {
      this.initCanvas();
    } else {
      this.initLottie();
    }
  }

  /**
   * Initialize canvas rendering
   */
  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.className = 'soul-canvas';

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
  }

  /**
   * Initialize Lottie rendering
   */
  initLottie() {
    const lottieContainer = document.createElement('div');
    lottieContainer.className = 'soul-lottie';
    lottieContainer.style.width = `${this.size}px`;
    lottieContainer.style.height = `${this.size}px`;

    this.container.appendChild(lottieContainer);
    this.lottiePlayer = lottieContainer;
  }

  /**
   * Render state
   */
  render(state, data = {}) {
    if (this.renderMode === 'canvas') {
      this.renderCanvas(state, data);
    } else {
      this.renderLottie(state, data);
    }
  }

  /**
   * Render using canvas
   */
  renderCanvas(state, data) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const centerX = this.size / 2;
    const centerY = this.size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, this.size, this.size);

    // Get color for state
    const color = this.getColorForState(state);

    // Draw ferrofluid circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.size / 2 - 10, 0, 2 * Math.PI);

    // Gradient fill
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.size / 2 - 10
    );
    gradient.addColorStop(0, color.inner);
    gradient.addColorStop(1, color.outer);

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = color.glow;
    ctx.fill();

    // Add spikes for processing/error states
    if (state === SoulStates.AMBER || state === SoulStates.RED) {
      this.drawSpikes(ctx, centerX, centerY, this.size / 2 - 10, color);
    }

    // Add Qibla indicator (subtle compass for neutral/green states)
    if (state === SoulStates.NEUTRAL || state === SoulStates.GREEN) {
      this.drawQiblaIndicator(ctx, centerX, centerY);
    }
  }

  /**
   * Draw ferrofluid spikes
   */
  drawSpikes(ctx, centerX, centerY, radius, color) {
    const spikeCount = 12;
    const spikeLength = 15;

    ctx.shadowBlur = 0;

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + spikeLength);
      const y2 = centerY + Math.sin(angle) * (radius + spikeLength);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color.outer;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Draw Qibla compass indicator (subtle)
   */
  drawQiblaIndicator(ctx, centerX, centerY) {
    // Simple north indicator (would need geolocation for actual Qibla)
    const indicatorSize = 8;

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - indicatorSize);
    ctx.lineTo(centerX - indicatorSize / 2, centerY + indicatorSize / 2);
    ctx.lineTo(centerX + indicatorSize / 2, centerY + indicatorSize / 2);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render using Lottie
   */
  async renderLottie(state, data) {
    const animationPath = this.animations[state];

    if (!animationPath) {
      console.warn(`No Lottie animation for state: ${state}`);
      return;
    }

    // Load Lottie library if not already loaded
    if (!window.lottie) {
      await this.loadLottie();
    }

    // Destroy current animation
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
    }

    // Load new animation
    this.currentAnimation = window.lottie.loadAnimation({
      container: this.lottiePlayer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animationPath,
    });
  }

  /**
   * Load Lottie library
   */
  async loadLottie() {
    if (window.lottie) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Get color scheme for state
   */
  getColorForState(state) {
    const colors = {
      [SoulStates.NEUTRAL]: {
        inner: 'rgba(100, 100, 120, 0.8)',
        outer: 'rgba(70, 70, 90, 0.6)',
        glow: 'rgba(100, 100, 120, 0.4)',
      },
      [SoulStates.AMBER]: {
        inner: 'rgba(255, 180, 0, 0.8)',
        outer: 'rgba(255, 140, 0, 0.6)',
        glow: 'rgba(255, 180, 0, 0.5)',
      },
      [SoulStates.GREEN]: {
        inner: 'rgba(0, 240, 100, 0.8)',
        outer: 'rgba(0, 200, 80, 0.6)',
        glow: 'rgba(0, 240, 100, 0.4)',
      },
      [SoulStates.RED]: {
        inner: 'rgba(255, 50, 50, 0.8)',
        outer: 'rgba(220, 30, 30, 0.6)',
        glow: 'rgba(255, 50, 50, 0.5)',
      },
    };

    return colors[state] || colors[SoulStates.NEUTRAL];
  }

  /**
   * Animate transition between states
   */
  async transition(fromState, toState, duration = 300) {
    // Simple fade transition
    if (!this.canvas) return;

    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      // Interpolate colors
      const fromColor = this.getColorForState(fromState);
      const toColor = this.getColorForState(toState);

      // Simple render with interpolated state
      this.render(toState);

      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Destroy renderer
   */
  destroy() {
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
    }

    if (this.canvas) {
      this.canvas.remove();
    }

    if (this.lottiePlayer) {
      this.lottiePlayer.remove();
    }
  }
}

export default SoulRenderer;
