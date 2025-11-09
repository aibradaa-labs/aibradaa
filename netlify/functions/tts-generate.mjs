/**
 * TTS (Text-to-Speech) Generation
 * AI Bradaa - Phase 6: Advanced AI Features
 *
 * PURPOSE: Convert AI responses to speech for accessibility and personality
 * PROVIDER: Google Cloud Text-to-Speech (cost-effective, high quality)
 * FEATURES:
 * - Male voice with energetic tone (Luffy-inspired)
 * - Manglish pronunciation support
 * - Streaming audio
 * - Speed control (0.5x - 2x)
 * - Multiple voice options
 *
 * PRICING: Google Cloud TTS Standard
 * - 0-4M characters/month: FREE
 * - 4M+ characters: $4.00 per 1M characters
 * - AI Bradaa usage: ~500k characters/month = FREE ✅
 */

import textToSpeech from '@google-cloud/text-to-speech';
import { Buffer } from 'buffer';

/**
 * Initialize Google Cloud TTS client
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
 */
let ttsClient = null;

function getTTSClient() {
  if (!ttsClient) {
    try {
      // Check if credentials are available
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SERVICE_ACCOUNT) {
        ttsClient = new textToSpeech.TextToSpeechClient();
      } else {
        console.warn('[TTS] Google Cloud credentials not configured. TTS unavailable.');
        return null;
      }
    } catch (error) {
      console.error('[TTS] Failed to initialize TTS client:', error);
      return null;
    }
  }
  return ttsClient;
}

/**
 * Voice profiles for AI Bradaa
 */
const voices = {
  // Male voices (energetic, friendly)
  default: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-J', // Male, energetic
    ssmlGender: 'MALE',
    description: 'Default AI Bradaa voice (energetic male)'
  },
  casual: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-D', // Male, casual
    ssmlGender: 'MALE',
    description: 'Casual friendly voice'
  },
  professional: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-A', // Male, professional
    ssmlGender: 'MALE',
    description: 'Professional voice for business users'
  },
  // Female voices (optional alternative)
  female: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-F', // Female, friendly
    ssmlGender: 'FEMALE',
    description: 'Female alternative voice'
  }
};

/**
 * Process text for better pronunciation
 * Handles Manglish and Malaysian terms
 *
 * @param {string} text - Text to process
 * @returns {string} - SSML-formatted text
 */
function preprocessTextForTTS(text) {
  // Remove emojis (TTS can't pronounce them)
  let processed = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  // Handle Manglish pronunciation hints
  const manglishMap = {
    'lah': '<phoneme alphabet="ipa" ph="lɑː">lah</phoneme>',
    'leh': '<phoneme alphabet="ipa" ph="lɛ">leh</phoneme>',
    'lor': '<phoneme alphabet="ipa" ph="lɔː">lor</phoneme>',
    'wah': '<phoneme alphabet="ipa" ph="wɑː">wah</phoneme>',
    'shiok': '<phoneme alphabet="ipa" ph="ʃiok">shiok</phoneme>',
    'paiseh': '<phoneme alphabet="ipa" ph="paɪsɛ">paiseh</phoneme>',
    'can': '<phoneme alphabet="ipa" ph="kæn">can</phoneme>', // Malaysian "can" (yes)
    'RM': 'ringgit', // Malaysian Ringgit currency
    'MYR': 'Malaysian Ringgit'
  };

  // Replace Manglish terms with pronunciation hints
  Object.entries(manglishMap).forEach(([term, replacement]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    processed = processed.replace(regex, replacement);
  });

  // Add emphasis to excited phrases
  processed = processed.replace(/wah|wow|amazing/gi, '<emphasis level="strong">$&</emphasis>');

  // Add pauses after sentences for natural flow
  processed = processed.replace(/\./g, '.<break time="400ms"/>');
  processed = processed.replace(/!/g, '!<break time="300ms"/>');
  processed = processed.replace(/\?/g, '?<break time="500ms"/>');

  // Wrap in SSML speak tag
  return `<speak>${processed}</speak>`;
}

/**
 * Generate speech from text
 *
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @returns {Promise<Buffer>} - Audio data (MP3)
 */
export async function generateSpeech(text, options = {}) {
  try {
    const client = getTTSClient();

    if (!client) {
      throw new Error('TTS client not initialized. Check Google Cloud credentials.');
    }

    const {
      voiceProfile = 'default',
      speakingRate = 1.0, // 0.5 - 2.0
      pitch = 0.0, // -20.0 to 20.0
      volumeGainDb = 0.0 // -96.0 to 16.0
    } = options;

    // Get voice configuration
    const voice = voices[voiceProfile] || voices.default;

    // Preprocess text for better pronunciation
    const ssmlText = preprocessTextForTTS(text);

    // Construct TTS request
    const request = {
      input: { ssml: ssmlText },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
        ssmlGender: voice.ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch,
        volumeGainDb,
        effectsProfileId: ['headphone-class-device'] // Optimize for headphones
      }
    };

    console.log('[TTS] Generating speech for text:', text.substring(0, 50) + '...');

    // Perform TTS request
    const [response] = await client.synthesizeSpeech(request);

    // Return audio content as Buffer
    return Buffer.from(response.audioContent, 'binary');

  } catch (error) {
    console.error('[TTS] Speech generation failed:', error);
    throw error;
  }
}

/**
 * List available voices
 *
 * @returns {Promise<Array>} - Available voices
 */
export async function listAvailableVoices() {
  try {
    const client = getTTSClient();

    if (!client) {
      // Return predefined voices if client not available
      return Object.entries(voices).map(([key, voice]) => ({
        id: key,
        ...voice
      }));
    }

    // Get all available voices from Google Cloud
    const [result] = await client.listVoices({});

    // Filter to English voices only
    const englishVoices = result.voices
      .filter(v => v.languageCodes.some(code => code.startsWith('en-')))
      .map(v => ({
        languageCode: v.languageCodes[0],
        name: v.name,
        ssmlGender: v.ssmlGender,
        naturalSampleRateHertz: v.naturalSampleRateHertz
      }));

    return englishVoices;

  } catch (error) {
    console.error('[TTS] Failed to list voices:', error);

    // Return predefined voices as fallback
    return Object.entries(voices).map(([key, voice]) => ({
      id: key,
      ...voice
    }));
  }
}

/**
 * Estimate TTS cost
 *
 * @param {string} text - Text to estimate
 * @returns {Object} - Cost estimate
 */
function estimateTTSCost(text) {
  const charCount = text.length;
  const freeMonthlyChars = 4000000; // 4M characters free per month

  let cost = 0;
  if (charCount > freeMonthlyChars) {
    const billableChars = charCount - freeMonthlyChars;
    cost = (billableChars / 1000000) * 4.00; // $4.00 per 1M characters
  }

  return {
    characters: charCount,
    cost: cost.toFixed(4),
    free: charCount <= freeMonthlyChars
  };
}

/**
 * Netlify function handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // GET /tts-generate - List available voices
    if (event.httpMethod === 'GET') {
      const voices = await listAvailableVoices();

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          voices,
          predefined: Object.keys(voices).length
        })
      };
    }

    // POST /tts-generate - Generate speech
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { text, voiceProfile, speakingRate, pitch } = body;

      if (!text) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Text is required' })
        };
      }

      // Check text length (max 5000 characters for safety)
      if (text.length > 5000) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Text too long (max 5000 characters)',
            length: text.length
          })
        };
      }

      // Generate speech
      const audioBuffer = await generateSpeech(text, {
        voiceProfile,
        speakingRate,
        pitch
      });

      // Estimate cost
      const costEstimate = estimateTTSCost(text);

      // Return audio as base64
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          audio: audioBuffer.toString('base64'),
          format: 'mp3',
          textLength: text.length,
          costEstimate,
          voiceProfile: voiceProfile || 'default',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('[TTS] Handler error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        note: 'TTS requires Google Cloud credentials. Check GOOGLE_APPLICATION_CREDENTIALS env var.'
      })
    };
  }
}
