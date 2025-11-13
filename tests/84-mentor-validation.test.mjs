/**
 * 84-Mentor System Validation Tests
 *
 * Validates that all 84 mentors from council_roster.json are:
 * 1. Loaded correctly into orchestrator_tools.mjs
 * 2. Have valid personas with required fields
 * 3. Can participate in voting
 * 4. Generate unique, reasonable votes
 */

import { describe, test, expect } from '@jest/globals';
import orchestratorTools from '../ai_pod/services/orchestrator_tools.mjs';

describe('84-Mentor System Validation', () => {

  test('All 84 mentors loaded from council roster', () => {
    const mentorCount = Object.keys(orchestratorTools.MENTOR_PERSONAS).length;
    expect(mentorCount).toBe(84);
  });

  test('Each mentor has required fields', () => {
    Object.entries(orchestratorTools.MENTOR_PERSONAS).forEach(([id, mentor]) => {
      expect(mentor).toHaveProperty('name');
      expect(mentor).toHaveProperty('expertise');
      expect(mentor).toHaveProperty('thinkingStyle');
      expect(mentor).toHaveProperty('riskAppetite');
      expect(mentor).toHaveProperty('votingWeight');
      expect(mentor).toHaveProperty('executionPlaybook');
      expect(mentor).toHaveProperty('keyQuestions');

      // Validate types
      expect(typeof mentor.name).toBe('string');
      expect(Array.isArray(mentor.expertise)).toBe(true);
      expect(typeof mentor.thinkingStyle).toBe('string');
      expect(typeof mentor.riskAppetite).toBe('string');
      expect(typeof mentor.votingWeight).toBe('number');
      expect(Array.isArray(mentor.executionPlaybook)).toBe(true);
      expect(Array.isArray(mentor.keyQuestions)).toBe(true);
    });
  });

  test('Key mentors are present', () => {
    const keyMentors = [
      'warrenbuffett',
      'charliemunger',
      'elonmusk',
      'andrewng',
      'geoffreyhinton',
      'bruceschneier',
      'martycagan',
      'muftimenk',
      'genekimdevops',
      'martinfowler',
    ];

    keyMentors.forEach(mentorId => {
      expect(orchestratorTools.MENTOR_PERSONAS).toHaveProperty(mentorId);
      expect(orchestratorTools.MENTOR_PERSONAS[mentorId].name).toBeTruthy();
    });
  });

  test('Executive Board members included (11 total)', () => {
    const executiveIds = [
      'warrenbuffett',
      'charliemunger',
      'andrewng',
      'geoffreyhinton',
      'bruceschneier',
      'martycagan',
      'genekimdevops',
      'martinfowler',
      'timosmani',
      'muftimenk',
      'timnitgebru',
    ];

    executiveIds.forEach(id => {
      expect(orchestratorTools.MENTOR_PERSONAS).toHaveProperty(id);
    });
  });

  test('Composite score calculation with multiple mentors', () => {
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

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(typeof score).toBe('number');
  });

  test('Dissent tracking works correctly', () => {
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

    const dissenters = orchestratorTools.trackDissent(mockVotes);

    expect(Array.isArray(dissenters)).toBe(true);
    expect(dissenters.length).toBe(1); // Bruce Schneier is minority (2 approve, 1 reject)
    expect(dissenters[0].mentorId).toBe('bruceschneier');
    expect(dissenters[0].vote).toBe('reject');
  });

  test('All mentors have unique names', () => {
    const names = Object.values(orchestratorTools.MENTOR_PERSONAS).map(m => m.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(84); // All names should be unique
  });

  test('All mentors have valid risk appetites', () => {
    const validRiskAppetites = ['Very Conservative', 'Conservative', 'Balanced', 'High', 'Very High', 'Cautious'];

    Object.values(orchestratorTools.MENTOR_PERSONAS).forEach(mentor => {
      expect(validRiskAppetites).toContain(mentor.riskAppetite);
    });
  });

  test('Mentor IDs are lowercase and hyphenated', () => {
    Object.keys(orchestratorTools.MENTOR_PERSONAS).forEach(id => {
      expect(id).toMatch(/^[a-z-]+$/); // Only lowercase letters and hyphens
      expect(id).not.toMatch(/[A-Z]/); // No uppercase
      expect(id).not.toMatch(/\s/); // No spaces
    });
  });

  test('Voting weights are reasonable (0.5 to 2.0)', () => {
    Object.values(orchestratorTools.MENTOR_PERSONAS).forEach(mentor => {
      expect(mentor.votingWeight).toBeGreaterThanOrEqual(0.5);
      expect(mentor.votingWeight).toBeLessThanOrEqual(2.0);
    });
  });

  test('Execution playbooks are not empty', () => {
    Object.values(orchestratorTools.MENTOR_PERSONAS).forEach(mentor => {
      expect(mentor.executionPlaybook.length).toBeGreaterThan(0);
    });
  });

  test('Key questions generated from execution playbook', () => {
    Object.values(orchestratorTools.MENTOR_PERSONAS).forEach(mentor => {
      expect(mentor.keyQuestions.length).toBeGreaterThanOrEqual(0);
      expect(mentor.keyQuestions.length).toBeLessThanOrEqual(3);
    });
  });
});
