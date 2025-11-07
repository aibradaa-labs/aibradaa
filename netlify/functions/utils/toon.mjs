/**
 * TOON (Token-Optimized Object Notation) Utility for Netlify Functions
 *
 * Provides lightweight TOON compression for AI prompts to reduce token usage by 30-60%.
 * TOON is primarily used for COMPRESSION (JSON → TOON) when sending data to AI models.
 *
 * Usage:
 *   import { compressForAI, calculateSavings } from './utils/toon.mjs';
 *   const compressed = compressForAI(laptopData);
 *   // Use compressed in AI prompt to save tokens
 */

// Abbreviation dictionary (full_name → abbreviation)
const ABBREV = {
  // Laptop core fields
  brand: 'br',
  model: 'mdl',
  price: 'pr',
  currency: 'cur',
  specifications: 'specs',
  processor: 'cpu',
  graphics: 'gpu',
  memory: 'ram',
  storage: 'sto',
  display: 'disp',
  battery: 'bat',
  weight: 'wt',
  dimensions: 'dim',
  availability: 'avail',
  release_date: 'rel',
  ratings: 'rat',
  reviews: 'rev',

  // Spec details
  cores: 'c',
  threads: 't',
  base_frequency: 'bf',
  boost_frequency: 'mf',
  max_frequency: 'mf',
  cache: 'csh',
  generation: 'gen',
  resolution: 'res',
  refresh_rate: 'hz',
  brightness: 'nit',
  color_gamut: 'col',
  color_accuracy: 'acc',

  // User/query fields
  budget: 'bdg',
  usage: 'use',
  preferences: 'pref',
  requirements: 'req',
  score: 'sc',
  score_composite: 'sc',
  reasoning: 'rsn',
  pros: 'pro',
  cons: 'con',
  recommendation: 'rec',
  recommendations: 'recs',

  // Common words
  description: 'desc',
  category: 'cat',
  type: 'typ',
  value: 'val',
  count: 'cnt',
  total: 'tot',
  average: 'avg',
  minimum: 'min',
  maximum: 'max',
  status: 'sts',
  message: 'msg',
};

// Symbol replacements
const SYMBOLS = {
  true: '+',
  false: '-',
};

/**
 * Compress JSON to TOON format for AI prompts
 *
 * @param {Object} json - JSON object to compress
 * @param {Object} options - Compression options
 * @param {boolean} options.indent - Whether to use indentation (default: false for max compression)
 * @returns {string} TOON-formatted string
 */
export function compressForAI(json, options = {}) {
  const indent = options.indent !== false; // Default: true for readability
  return compress(json, indent ? 0 : -1);
}

/**
 * Compress object recursively
 */
function compress(obj, depth = 0) {
  if (typeof obj !== 'object' || obj === null) {
    return formatValue(obj);
  }

  if (Array.isArray(obj)) {
    return compressArray(obj, depth);
  }

  const useIndent = depth >= 0;
  const indent = useIndent ? ' '.repeat(depth) : '';
  const entries = Object.entries(obj);

  if (entries.length === 0) return '{}';

  // Single-line for small objects (≤3 keys)
  if (entries.length <= 3 && depth > 0) {
    const compressed = entries
      .map(([key, value]) => {
        const abbrevKey = ABBREV[key] || key;
        return `${abbrevKey}:${formatValue(value)}`;
      })
      .join(' ');
    return `{${compressed}}`;
  }

  // Multi-line for larger objects
  const lines = entries.map(([key, value]) => {
    const abbrevKey = ABBREV[key] || key;

    if (typeof value === 'object' && value !== null) {
      const compressed = compress(value, useIndent ? depth + 1 : -1);
      return useIndent ? `${indent}${abbrevKey}${compressed}` : `${abbrevKey}${compressed}`;
    }

    return useIndent
      ? `${indent}${abbrevKey}:${formatValue(value)}`
      : `${abbrevKey}:${formatValue(value)}`;
  });

  if (useIndent) {
    const closing = ' '.repeat(Math.max(0, depth - 1));
    return `{\n${lines.join('\n')}\n${closing}}`;
  } else {
    return `{${lines.join(' ')}}`;
  }
}

/**
 * Compress array
 */
function compressArray(arr, depth) {
  if (arr.length === 0) return '[]';

  const useIndent = depth >= 0;

  // Inline for short arrays (≤5 items)
  if (arr.length <= 5) {
    const compressed = arr.map(formatValue).join(',');
    return `[${compressed}]`;
  }

  // Multi-line for longer arrays
  if (useIndent) {
    const indent = ' '.repeat(depth + 1);
    const items = arr.map((item) => `${indent}${formatValue(item)}`).join(',\n');
    return `[\n${items}\n${' '.repeat(depth)}]`;
  } else {
    const items = arr.map(formatValue).join(',');
    return `[${items}]`;
  }
}

/**
 * Format individual value
 */
function formatValue(value) {
  if (value === null || value === undefined) return 'null';

  // Boolean to symbol
  if (value === true) return SYMBOLS.true;
  if (value === false) return SYMBOLS.false;

  // Number
  if (typeof value === 'number') return value.toString();

  // String
  if (typeof value === 'string') {
    // Remove quotes for simple alphanumeric strings
    if (/^[a-zA-Z0-9_.-]+$/.test(value)) {
      return value;
    }
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  // Nested object/array
  if (typeof value === 'object') {
    return compress(value, -1); // No indent for nested values
  }

  return JSON.stringify(value);
}

/**
 * Calculate token savings from TOON compression
 *
 * @param {Object} json - Original JSON
 * @returns {Object} Savings statistics
 */
export function calculateSavings(json) {
  const jsonString = JSON.stringify(json);
  const toonString = compressForAI(json, { indent: false });

  // Rough token estimate (1 token ≈ 4 chars)
  const jsonTokens = Math.ceil(jsonString.length / 4);
  const toonTokens = Math.ceil(toonString.length / 4);
  const saved = jsonTokens - toonTokens;
  const percentage = ((saved / jsonTokens) * 100).toFixed(1);

  return {
    jsonChars: jsonString.length,
    toonChars: toonString.length,
    jsonTokens,
    toonTokens,
    tokensSaved: saved,
    percentageSaved: `${percentage}%`,
    compressionRatio: (jsonString.length / toonString.length).toFixed(2),
  };
}

/**
 * Wrap data in TOON format with explanation (for AI context)
 *
 * @param {Object} data - Data to compress
 * @param {string} label - Label for the data block
 * @returns {string} TOON block with header
 */
export function wrapForAI(data, label = 'Data') {
  const toon = compressForAI(data);
  return `${label} (TOON format - Token-Optimized):\n${toon}`;
}

/**
 * Safe compression with fallback
 * Returns TOON if successful, JSON if TOON fails
 *
 * @param {Object} json - JSON to compress
 * @returns {string} TOON or JSON string
 */
export function safeCompress(json) {
  try {
    return compressForAI(json, { indent: false });
  } catch (error) {
    console.error('TOON compression failed, falling back to JSON:', error);
    return JSON.stringify(json);
  }
}

export default {
  compressForAI,
  calculateSavings,
  wrapForAI,
  safeCompress,
};
