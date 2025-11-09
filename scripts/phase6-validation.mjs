#!/usr/bin/env node

/**
 * Phase 6 Validation Script
 * Validates all Phase 6 implementations for AI Bradaa
 */

import { existsSync } from 'fs';
import { join } from 'path';

const validations = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('🔍 Phase 6 Implementation Validation\n');
console.log('=' .repeat(60));

/**
 * Check if file exists
 */
function checkFile(path, description) {
  const fullPath = join(process.cwd(), path);
  if (existsSync(fullPath)) {
    validations.passed.push(`✅ ${description}`);
    return true;
  } else {
    validations.failed.push(`❌ ${description} - File not found: ${path}`);
    return false;
  }
}

/**
 * Run all validations
 */
function runValidations() {
  console.log('\n1. One Piece Legal Safety\n' + '-'.repeat(60));

  checkFile('internal/one-piece-reference/episode-database.json', 'Episode database created');
  checkFile('internal/one-piece-reference/tone-guide.md', 'Tone guide created');
  checkFile('internal/one-piece-reference/README.md', 'Internal README created');
  checkFile('netlify/functions/paraphrase-engine.mjs', 'Paraphrase engine implemented');

  console.log('\n2. Animated Signup Wizard\n' + '-'.repeat(60));

  checkFile('public/scripts/signup-wizard.js', 'Signup wizard script created');
  checkFile('public/styles/signup-animations.css', 'Signup animations CSS created');

  console.log('\n3. Chat UI Enhancement\n' + '-'.repeat(60));

  checkFile('public/styles/command-ui.css', 'Command UI CSS created');

  console.log('\n4. RAG Implementation\n' + '-'.repeat(60));

  checkFile('netlify/functions/rag-search.mjs', 'RAG search function created');

  console.log('\n5. Deep Research Agent\n' + '-'.repeat(60));

  checkFile('netlify/functions/deep-research.mjs', 'Deep research agent created');

  console.log('\n6. TTS Integration\n' + '-'.repeat(60));

  checkFile('netlify/functions/tts-generate.mjs', 'TTS generation function created');
}

// Run validations
runValidations();

// Print summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 VALIDATION SUMMARY\n');
console.log(`✅ Passed: ${validations.passed.length}`);
console.log(`❌ Failed: ${validations.failed.length}`);
console.log(`⚠️  Warnings: ${validations.warnings.length}`);

if (validations.passed.length > 0) {
  console.log('\n✅ PASSED:');
  validations.passed.forEach(msg => console.log(`   ${msg}`));
}

if (validations.failed.length > 0) {
  console.log('\n❌ FAILED:');
  validations.failed.forEach(msg => console.log(`   ${msg}`));
}

if (validations.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  validations.warnings.forEach(msg => console.log(`   ${msg}`));
}

console.log('\n' + '='.repeat(60));

const successRate = (validations.passed.length / (validations.passed.length + validations.failed.length)) * 100;
console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%\n`);

process.exit(validations.failed.length > 0 ? 1 : 0);
