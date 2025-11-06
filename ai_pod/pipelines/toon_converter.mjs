/**
 * TOON Converter
 * Convert between JSON and TOON (Token-Optimized Object Notation)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load TOON schema
const schemaPath = path.join(__dirname, 'toon_schema.yaml');
const schema = yaml.load(fs.readFileSync(schemaPath, 'utf8'));

// Abbreviation maps
const ABBREV_TO_FULL = schema.abbreviations;
const FULL_TO_ABBREV = Object.fromEntries(
  Object.entries(ABBREV_TO_FULL).map(([k, v]) => [v, k])
);

// Symbol maps
const SYMBOL_TO_WORD = schema.symbols;
const WORD_TO_SYMBOL = Object.fromEntries(
  Object.entries(SYMBOL_TO_WORD).map(([k, v]) => [v, k])
);

/**
 * Convert JSON to TOON format
 *
 * @param {Object} json - JSON object to convert
 * @returns {string} TOON-formatted string
 */
export function jsonToToon(json) {
  return compressObject(json, 0);
}

/**
 * Convert TOON to JSON format
 *
 * @param {string} toon - TOON string to parse
 * @returns {Object} Parsed JSON object
 */
export function toonToJson(toon) {
  try {
    // Expand abbreviations
    let expanded = toon;
    Object.entries(FULL_TO_ABBREV).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev}:`, 'g');
      expanded = expanded.replace(regex, `${full}:`);
    });

    // Replace symbols
    Object.entries(WORD_TO_SYMBOL).forEach(([word, symbol]) => {
      expanded = expanded.replace(new RegExp(`\\b${symbol}\\b`, 'g'), word);
    });

    // Convert compact syntax to JSON
    expanded = expanded.replace(/(\w+):/g, '"$1":'); // Add quotes to keys
    expanded = expanded.replace(/}(\w)/g, '},"$1'); // Add commas between objects

    // Parse as JSON
    return JSON.parse(expanded);
  } catch (error) {
    console.error('Failed to parse TOON:', error);
    // Fallback: try parsing as JSON directly
    return JSON.parse(toon);
  }
}

/**
 * Compress object to TOON format (recursive)
 */
function compressObject(obj, depth = 0) {
  if (typeof obj !== 'object' || obj === null) {
    return compressValue(obj);
  }

  if (Array.isArray(obj)) {
    return compressArray(obj);
  }

  const indent = ' '.repeat(depth);
  const entries = Object.entries(obj);

  // Single-line for small objects (≤3 keys)
  if (entries.length <= 3 && depth > 0) {
    const compressed = entries
      .map(([key, value]) => {
        const abbrevKey = FULL_TO_ABBREV[key] || key;
        return `${abbrevKey}:${compressValue(value)}`;
      })
      .join(' ');
    return `{${compressed}}`;
  }

  // Multi-line for larger objects
  const lines = entries.map(([key, value]) => {
    const abbrevKey = FULL_TO_ABBREV[key] || key;

    if (typeof value === 'object' && value !== null) {
      return `${indent}${abbrevKey}${compressObject(value, depth + 1)}`;
    }

    return `${indent}${abbrevKey}:${compressValue(value)}`;
  });

  return `{\n${lines.join('\n')}\n${' '.repeat(Math.max(0, depth - 1))}}`;
}

/**
 * Compress array to TOON format
 */
function compressArray(arr) {
  if (arr.length === 0) return '[]';

  // Inline for short arrays (≤5 items)
  if (arr.length <= 5) {
    const compressed = arr.map(compressValue).join(',');
    return `[${compressed}]`;
  }

  // Multi-line for longer arrays
  const items = arr.map((item) => `  ${compressValue(item)}`).join('\n');
  return `[\n${items}\n]`;
}

/**
 * Compress individual value
 */
function compressValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'null';

  // Boolean to symbol
  if (value === true) return WORD_TO_SYMBOL['true'] || 'true';
  if (value === false) return WORD_TO_SYMBOL['false'] || 'false';

  // Number
  if (typeof value === 'number') return value.toString();

  // String
  if (typeof value === 'string') {
    // Check if needs quotes
    if (/^[a-zA-Z0-9_.-]+$/.test(value)) {
      return value; // No quotes needed
    }
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  // Nested object/array
  if (typeof value === 'object') {
    return compressObject(value);
  }

  return JSON.stringify(value);
}

/**
 * Calculate token savings
 *
 * @param {Object} json - Original JSON
 * @returns {Object} Savings statistics
 */
export function calculateSavings(json) {
  const jsonString = JSON.stringify(json);
  const toonString = jsonToToon(json);

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
  };
}

/**
 * Validate TOON against schema
 *
 * @param {string} toon - TOON string
 * @returns {Object} Validation result
 */
export function validateToon(toon) {
  try {
    const json = toonToJson(toon);

    // Check required fields
    const required = schema.validation.required || [];
    const missing = required.filter((field) => {
      const fullField = ABBREV_TO_FULL[field] || field;
      return !(fullField in json);
    });

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missing.join(', ')}`],
      };
    }

    // Type validation (simplified)
    const types = schema.validation.types || {};
    const typeErrors = [];

    Object.entries(types).forEach(([field, expectedType]) => {
      const fullField = ABBREV_TO_FULL[field] || field;
      const value = json[fullField];

      if (value === undefined) return;

      if (expectedType === 'number' && typeof value !== 'number') {
        typeErrors.push(`${fullField} should be a number`);
      } else if (expectedType === 'string' && typeof value !== 'string') {
        typeErrors.push(`${fullField} should be a string`);
      }
    });

    if (typeErrors.length > 0) {
      return {
        valid: false,
        errors: typeErrors,
      };
    }

    return {
      valid: true,
      errors: [],
      json,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message],
    };
  }
}

/**
 * CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (!command) {
    console.log(`
TOON Converter

Usage:
  node toon_converter.mjs json2toon <file.json>    Convert JSON to TOON
  node toon_converter.mjs toon2json <file.toon>    Convert TOON to JSON
  node toon_converter.mjs validate <file.toon>     Validate TOON
  node toon_converter.mjs savings <file.json>      Calculate token savings

Example:
  node toon_converter.mjs json2toon laptops.json
    `);
    process.exit(0);
  }

  const filePath = process.argv[3];

  if (!filePath) {
    console.error('Error: File path required');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');

  try {
    switch (command) {
      case 'json2toon': {
        const json = JSON.parse(content);
        const toon = jsonToToon(json);
        console.log(toon);
        break;
      }

      case 'toon2json': {
        const json = toonToJson(content);
        console.log(JSON.stringify(json, null, 2));
        break;
      }

      case 'validate': {
        const result = validateToon(content);
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
      }

      case 'savings': {
        const json = JSON.parse(content);
        const savings = calculateSavings(json);
        console.log(JSON.stringify(savings, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export default {
  jsonToToon,
  toonToJson,
  validateToon,
  calculateSavings,
};
