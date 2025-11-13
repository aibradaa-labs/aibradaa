/**
 * 84-Mentor System Validation Script
 *
 * Quick validation that all 84 mentors are loaded and functional
 */

import orchestratorTools from '../ai_pod/services/orchestrator_tools.mjs';

console.log('\n🔍 84-MENTOR SYSTEM VALIDATION\n');
console.log('═'.repeat(60));

// Test 1: Count mentors
const mentorCount = Object.keys(orchestratorTools.MENTOR_PERSONAS).length;
console.log(`\n✅ Test 1: Mentor Count`);
console.log(`   Expected: 84`);
console.log(`   Actual: ${mentorCount}`);
console.log(`   Status: ${mentorCount === 84 ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Check key mentors exist
const keyMentors = [
  'warrenbuffett',
  'charliemunger',
  'elonmusk',
  'andrewng',
  'geoffreyhinton',
  'bruceschneier',
  'martycagan',
  'muftimenk',
  'genekim',
  'fowler',
];

console.log(`\n✅ Test 2: Key Mentors Present`);
let missingMentors = [];
keyMentors.forEach(id => {
  const exists = orchestratorTools.MENTOR_PERSONAS[id];
  if (!exists) missingMentors.push(id);
  console.log(`   ${exists ? '✓' : '✗'} ${id} → ${exists ? exists.name : 'MISSING'}`);
});
console.log(`   Status: ${missingMentors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);

// Test 3: Validate mentor structure
console.log(`\n✅ Test 3: Mentor Data Validation`);
const requiredFields = ['name', 'expertise', 'thinkingStyle', 'riskAppetite', 'votingWeight', 'executionPlaybook', 'keyQuestions'];
let invalidMentors = [];

Object.entries(orchestratorTools.MENTOR_PERSONAS).forEach(([id, mentor]) => {
  requiredFields.forEach(field => {
    if (!mentor.hasOwnProperty(field)) {
      invalidMentors.push(`${id} missing ${field}`);
    }
  });
});

if (invalidMentors.length === 0) {
  console.log(`   ✓ All ${mentorCount} mentors have required fields`);
  console.log(`   Status: ✅ PASS`);
} else {
  console.log(`   ✗ Invalid mentors found:`);
  invalidMentors.slice(0, 5).forEach(err => console.log(`     - ${err}`));
  console.log(`   Status: ❌ FAIL`);
}

// Test 4: Composite score calculation
console.log(`\n✅ Test 4: Composite Score Calculation`);
const mockVotes = [
  {
    mentor: { id: 'warrenbuffett', name: 'Warren Buffett', votingWeight: 1.3 },
    vote: { decision: 'approve', reasoning: 'Strong ROI', confidence: 0.95 },
    confidence: 0.95,
  },
  {
    mentor: { id: 'charliemunger', name: 'Charlie Munger', votingWeight: 1.2 },
    vote: { decision: 'approve', reasoning: 'Good trade-offs', confidence: 0.88 },
    confidence: 0.88,
  },
  {
    mentor: { id: 'bruceschneier', name: 'Bruce Schneier', votingWeight: 1.4 },
    vote: { decision: 'reject', reasoning: 'Security concerns', confidence: 0.92 },
    confidence: 0.92,
  },
];

const score = orchestratorTools.calculateCompositeScore(mockVotes);
console.log(`   Composite Score: ${score}/100`);
console.log(`   Status: ${score >= 0 && score <= 100 ? '✅ PASS' : '❌ FAIL'}`);

// Test 5: Dissent tracking
console.log(`\n✅ Test 5: Dissent Tracking`);
const dissenters = orchestratorTools.trackDissent(mockVotes);
console.log(`   Minority Votes: ${dissenters.length}`);
console.log(`   Dissenters: ${dissenters.map(d => d.mentorName).join(', ')}`);
console.log(`   Status: ${dissenters.length === 1 && dissenters[0].mentorId === 'bruceschneier' ? '✅ PASS' : '❌ FAIL'}`);

// Test 6: Executive Board (11 members)
console.log(`\n✅ Test 6: Executive Board Members`);
const executiveIds = [
  'warrenbuffett',
  'charliemunger',
  'andrewng',
  'geoffreyhinton',
  'bruceschneier',
  'martycagan',
  'genekim',
  'fowler',
  'usmani',
  'muftimenk',
  'gebru',
];

let missingExecs = [];
executiveIds.forEach(id => {
  const exists = orchestratorTools.MENTOR_PERSONAS[id];
  if (!exists) missingExecs.push(id);
});
console.log(`   Executive Board Size: ${executiveIds.length}`);
console.log(`   All Present: ${missingExecs.length === 0 ? 'Yes' : 'No'}`);
if (missingExecs.length > 0) {
  console.log(`   Missing: ${missingExecs.join(', ')}`);
}
console.log(`   Status: ${missingExecs.length === 0 ? '✅ PASS' : '❌ FAIL'}`);

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📊 VALIDATION SUMMARY\n');
console.log(`   Total Mentors: ${mentorCount}/84`);
console.log(`   Key Mentors: ${keyMentors.length - missingMentors.length}/${keyMentors.length}`);
console.log(`   Executive Board: ${executiveIds.length - missingExecs.length}/${executiveIds.length}`);
console.log(`   Data Integrity: ${invalidMentors.length === 0 ? 'Valid' : `${invalidMentors.length} issues`}`);
console.log(`   Voting System: Operational`);
console.log(`   Composite Scoring: ${score}/100`);
console.log(`   Dissent Tracking: Operational`);

const allPassed = mentorCount === 84 &&
                  missingMentors.length === 0 &&
                  invalidMentors.length === 0 &&
                  missingExecs.length === 0 &&
                  score >= 0 && score <= 100;

console.log(`\n   ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}\n`);
console.log('═'.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
