/**
 * GitHub Actions Integration Example
 * Shows how to integrate Syeddy Orchestrator with CI/CD pipelines
 *
 * This demonstrates a REAL, FUNCTIONING integration where GitHub Actions
 * automatically consults the 84-mentor system before deployments.
 *
 * @module github_actions_integration
 */

import { getSyeddyOrchestrator } from '../syeddy_orchestrator.mjs';

/**
 * Example 1: Production Deployment Approval
 *
 * Add this to your GitHub Actions workflow:
 *
 * ```yaml
 * deploy:
 *   name: Deploy to Production
 *   runs-on: ubuntu-latest
 *   steps:
 *     - name: Checkout
 *       uses: actions/checkout@v4
 *
 *     - name: 84-Mentor Approval
 *       run: |
 *         node project/governance/84/examples/github_actions_integration.mjs \
 *           --action deploy \
 *           --version ${{ github.ref_name }} \
 *           --commit ${{ github.sha }} \
 *           --actor ${{ github.actor }}
 *
 *     - name: Deploy
 *       if: success()
 *       run: npm run deploy
 * ```
 */
export async function requestDeploymentApproval(options) {
  const { version, commit, actor, environment = 'production' } = options;

  const orchestrator = getSyeddyOrchestrator();

  const result = await orchestrator.submitDecision({
    type: 'PRODUCTION_DEPLOYMENT',
    title: `Deploy ${version} to ${environment}`,
    description: `Requesting production deployment approval for version ${version}`,
    context: {
      version,
      commit,
      environment,
      cicd: 'github-actions',
    },
    requestedBy: actor || 'github-actions',
    urgency: environment === 'production' ? 'high' : 'normal',
  });

  return result;
}

/**
 * Example 2: Breaking Change Review
 *
 * Use this in PR checks:
 *
 * ```yaml
 * breaking-change-check:
 *   name: Check for Breaking Changes
 *   runs-on: ubuntu-latest
 *   steps:
 *     - name: Detect breaking changes
 *       id: detect
 *       run: |
 *         # Your breaking change detection logic
 *         echo "has_breaking_changes=true" >> $GITHUB_OUTPUT
 *
 *     - name: 84-Mentor Review
 *       if: steps.detect.outputs.has_breaking_changes == 'true'
 *       run: |
 *         node project/governance/84/examples/github_actions_integration.mjs \
 *           --action breaking-change \
 *           --pr ${{ github.event.pull_request.number }} \
 *           --title "${{ github.event.pull_request.title }}"
 * ```
 */
export async function requestBreakingChangeReview(options) {
  const { prNumber, title, description, files = [] } = options;

  const orchestrator = getSyeddyOrchestrator();

  const result = await orchestrator.submitDecision({
    type: 'BREAKING_CHANGE',
    title: `Breaking Change in PR #${prNumber}: ${title}`,
    description: description || 'Breaking API changes detected',
    context: {
      prNumber,
      files,
      affectedEndpoints: files.filter((f) => f.includes('api/')),
    },
    requestedBy: 'github-actions',
    urgency: 'high',
  });

  return result;
}

/**
 * Example 3: Security Change Review
 */
export async function requestSecurityReview(options) {
  const { title, description, files = [], severity = 'high' } = options;

  const orchestrator = getSyeddyOrchestrator();

  const result = await orchestrator.submitDecision({
    type: 'SECURITY_CHANGE',
    title,
    description,
    context: {
      files,
      severity,
      securityScan: true,
    },
    requestedBy: 'security-bot',
    urgency: 'critical',
  });

  return result;
}

/**
 * Example 4: Configuration Change Review
 */
export async function requestConfigReview(options) {
  const { configFile, changes, requestedBy } = options;

  const orchestrator = getSyeddyOrchestrator();

  const result = await orchestrator.submitDecision({
    type: 'CODE_CHANGE',
    title: `Configuration change: ${configFile}`,
    description: `Changes to configuration file`,
    context: {
      file: configFile,
      changes,
      configChange: true,
    },
    requestedBy: requestedBy || 'github-actions',
    urgency: configFile.includes('production') ? 'high' : 'normal',
  });

  return result;
}

// ============================================================================
// CLI INTERFACE FOR GITHUB ACTIONS
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      if (value !== true) i++;
    }
  }

  const action = options.action;

  if (!action) {
    console.error('❌ Error: --action is required');
    console.log('Available actions: deploy, breaking-change, security, config');
    process.exit(1);
  }

  let result;

  try {
    switch (action) {
      case 'deploy':
        result = await requestDeploymentApproval(options);
        break;

      case 'breaking-change':
        result = await requestBreakingChangeReview(options);
        break;

      case 'security':
        result = await requestSecurityReview(options);
        break;

      case 'config':
        result = await requestConfigReview(options);
        break;

      default:
        console.error(`❌ Error: Unknown action '${action}'`);
        process.exit(1);
    }

    // Output for GitHub Actions
    console.log(`::set-output name=decision::${result.decision}`);
    console.log(`::set-output name=approval::${result.compositeApproval}`);
    console.log(`::set-output name=decision_id::${result.id}`);

    // Exit with appropriate code
    process.exit(result.decision === 'APPROVED' ? 0 : 1);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
