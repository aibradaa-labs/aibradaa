/**
 * Camera Tech Module
 * Webcam sensor specs and DxOMark integration (Coming Soon placeholder for Phase 1)
 */

import { apiClient } from '../shared/utils/api.mjs';

export class CameraTech {
  constructor() {
    this.cameras = [];
    this.isComingSoon = true; // Phase 1 placeholder
  }

  /**
   * Load camera specs (Phase 2 feature)
   */
  async loadCameras() {
    if (this.isComingSoon) {
      return {
        message: 'Camera Tech coming in Phase 2!',
        features: [
          'Detailed webcam sensor specs',
          'DxOMark integration for quality scores',
          'Low-light performance comparisons',
          'Microphone quality ratings',
          'Video conferencing readiness',
        ],
        eta: 'Q2 2025',
      };
    }

    try {
      const response = await apiClient.get('/api/camera-tech');
      this.cameras = response.data || [];
      return this.cameras;
    } catch (error) {
      console.error('Failed to load camera specs:', error);
      throw error;
    }
  }

  /**
   * Get camera specs for a laptop
   */
  async getCameraSpecs(laptopId) {
    if (this.isComingSoon) {
      return {
        message: 'Camera specs coming soon!',
        placeholder: {
          sensor: 'TBD',
          resolution: 'TBD',
          fps: 'TBD',
          lowLightScore: 'TBD',
          micQuality: 'TBD',
        },
      };
    }

    try {
      const response = await apiClient.get(`/api/camera-tech/${laptopId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to load camera specs:', error);
      throw error;
    }
  }

  /**
   * Compare camera quality across laptops
   */
  async compareCameras(laptopIds) {
    if (this.isComingSoon) {
      return {
        message: 'Camera comparison coming in Phase 2!',
        laptops: laptopIds,
      };
    }

    try {
      const response = await apiClient.post('/api/camera-tech/compare', {
        laptopIds,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to compare cameras:', error);
      throw error;
    }
  }

  /**
   * Get DxOMark score for laptop camera
   */
  async getDxOMarkScore(laptopId) {
    if (this.isComingSoon) {
      return {
        message: 'DxOMark integration coming soon!',
        score: null,
      };
    }

    try {
      const response = await apiClient.get(`/api/camera-tech/${laptopId}/dxomark`);
      return response.data;
    } catch (error) {
      console.error('Failed to load DxOMark score:', error);
      throw error;
    }
  }

  /**
   * Get best laptops for video conferencing
   */
  async getBestForVideoConf(limit = 10) {
    if (this.isComingSoon) {
      return {
        message: 'Video conferencing rankings coming in Phase 2!',
        features: [
          '1080p+ webcam rankings',
          'Noise-cancelling mic ratings',
          'Background blur support',
          'Wide-angle lens comparisons',
        ],
      };
    }

    try {
      const response = await apiClient.get('/api/camera-tech/video-conf', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to load video conf rankings:', error);
      throw error;
    }
  }

  /**
   * Check feature availability
   */
  isFeatureAvailable() {
    return !this.isComingSoon;
  }

  /**
   * Get roadmap info
   */
  getRoadmap() {
    return {
      phase: 'Phase 2',
      eta: 'Q2 2025',
      features: [
        {
          name: 'Webcam Sensor Database',
          description: 'Detailed specs for all laptop webcams',
          status: 'planned',
        },
        {
          name: 'DxOMark Integration',
          description: 'Professional camera quality scores',
          status: 'planned',
        },
        {
          name: 'Low-Light Testing',
          description: 'Real-world low-light performance data',
          status: 'planned',
        },
        {
          name: 'Microphone Analysis',
          description: 'Audio quality ratings and noise cancellation tests',
          status: 'planned',
        },
        {
          name: 'Video Conf Optimization',
          description: 'Best laptops for Zoom, Teams, Meet',
          status: 'planned',
        },
      ],
      requestEarlyAccess: 'Contact us for Phase 2 beta testing',
    };
  }
}

export default CameraTech;
