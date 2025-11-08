/**
 * AI Bradaa - Database Repositories Index
 *
 * Central export point for all repositories
 * 84-Mentor Pattern: Single entry point for dependency injection
 */

import userRepository from './UserRepository.mjs';
import sessionRepository from './SessionRepository.mjs';
import usageRepository from './UsageRepository.mjs';

export {
  userRepository,
  sessionRepository,
  usageRepository
};

export default {
  user: userRepository,
  session: sessionRepository,
  usage: usageRepository
};
