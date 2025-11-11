#!/usr/bin/env node
/**
 * Syeddy Orchestrator CLI
 * Command-line interface for 84-mentor governance system
 *
 * Usage:
 *   node tools/syeddy-cli.mjs submit --type CODE_CHANGE --title "Fix bug" --description "Details..."
 *   node tools/syeddy-cli.mjs history
 *   node tools/syeddy-cli.mjs mentors
 *   node tools/syeddy-cli.mjs mentor andrew-ng
 *
 * @module syeddy_cli
 */

import { getSyeddyOrchestrator, DECISION_TYPES } from '../project/governance/84/syeddy_orchestrator.mjs';

// ============================================================================
// CLI COMMANDS
// ============================================================================

async function submitDecision(args) {
  const orchestrator = getSyeddyOrchestrator();

  const type = args.type;
  const title = args.title;
  const description = args.description || '';
  const urgency = args.urgency || 'normal';
  const requestedBy = args.by || 'cli';

  if (!type || !title) {
    console.error('❌ Error: --type and --title are required');
    console.log('\nAvailable decision types:');
    Object.keys(DECISION_TYPES).forEach((key) => {
      console.log(`  - ${key}: ${DECISION_TYPES[key].description}`);
    });
    process.exit(1);
  }

  const context = {};
  if (args.file) context.file = args.file;
  if (args.pr) context.pr = args.pr;
  if (args.commit) context.commit = args.commit;

  try {
    const result = await orchestrator.submitDecision({
      type,
      title,
      description,
      context,
      requestedBy,
      urgency,
    });

    console.log(`\n✅ Decision processed: ${result.decision}`);
    console.log(`   Composite approval: ${result.compositeApproval}%`);
    console.log(`   Decision ID: ${result.id}`);

    process.exit(result.decision === 'APPROVED' ? 0 : 1);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

async function showHistory(args) {
  const orchestrator = getSyeddyOrchestrator();
  const history = orchestrator.getDecisionHistory();

  if (history.length === 0) {
    console.log('No decisions in history yet.');
    return;
  }

  console.log(`\n📜 Decision History (${history.length} decisions)\n`);
  history.forEach((decision, index) => {
    console.log(`${index + 1}. [${decision.decision}] ${decision.title}`);
    console.log(`   Type: ${decision.type}`);
    console.log(`   ID: ${decision.id}`);
    console.log(`   Approval: ${decision.compositeApproval}%`);
    console.log(`   Time: ${decision.timestamp}`);
    console.log(``);
  });
}

async function listMentors(args) {
  const orchestrator = getSyeddyOrchestrator();
  const mentors = orchestrator.getAllMentors();

  if (args.council) {
    const filtered = mentors.filter((m) => m.councilKey === args.council);
    console.log(`\n👥 Mentors in ${args.council} Council (${filtered.length})\n`);
    filtered.forEach((mentor) => {
      console.log(`  ${mentor.name} (${mentor.id})`);
      console.log(`    Weight: ${mentor.votingWeight}`);
      console.log(`    Expertise: ${mentor.expertise.join(', ')}`);
      console.log(``);
    });
  } else {
    console.log(`\n👥 All Mentors (${mentors.length})\n`);
    const byCouncil = {};
    mentors.forEach((m) => {
      if (!byCouncil[m.councilName]) byCouncil[m.councilName] = [];
      byCouncil[m.councilName].push(m);
    });

    Object.entries(byCouncil).forEach(([councilName, members]) => {
      console.log(`📋 ${councilName} (${members.length} mentors)`);
      members.forEach((m) => {
        console.log(`   - ${m.name} (weight: ${m.votingWeight})`);
      });
      console.log(``);
    });
  }
}

async function showMentor(args) {
  const orchestrator = getSyeddyOrchestrator();
  const mentorId = args._[1];

  if (!mentorId) {
    console.error('❌ Error: mentor ID required');
    console.log('Usage: node tools/syeddy-cli.mjs mentor <mentor-id>');
    process.exit(1);
  }

  const mentor = orchestrator.getMentor(mentorId);
  if (!mentor) {
    console.error(`❌ Error: Mentor '${mentorId}' not found`);
    process.exit(1);
  }

  console.log(`\n👤 ${mentor.name}\n`);
  console.log(`ID: ${mentorId}`);
  console.log(`Council: ${mentor.council}`);
  console.log(`Voting Weight: ${mentor.votingWeight}`);
  console.log(`Specialization: ${mentor.specialization}`);
  console.log(`Expertise:`);
  mentor.expertise.forEach((exp) => {
    console.log(`  - ${exp}`);
  });
  console.log(``);
}

async function showDecisionTypes() {
  console.log(`\n📋 Available Decision Types\n`);

  Object.entries(DECISION_TYPES).forEach(([key, config]) => {
    console.log(`${key}`);
    console.log(`  Name: ${config.name}`);
    console.log(`  Description: ${config.description}`);
    console.log(`  Required Councils: ${config.requiredCouncils.join(', ')}`);
    console.log(`  Quorum: ${config.quorumPercentage}%`);
    console.log(`  Approval Threshold: ${(config.approvalThreshold * 100).toFixed(0)}%`);
    console.log(``);
  });
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i++;
    } else {
      args._.push(arg);
    }
  }
  return args;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = parseArgs(process.argv);
  const command = args._[0];

  console.log(`\n🏛️  Syeddy Orchestrator CLI - 84-Mentor Governance\n`);

  try {
    switch (command) {
      case 'submit':
        await submitDecision(args);
        break;

      case 'history':
        await showHistory(args);
        break;

      case 'mentors':
        await listMentors(args);
        break;

      case 'mentor':
        await showMentor(args);
        break;

      case 'types':
        await showDecisionTypes();
        break;

      case 'help':
      case undefined:
        console.log(`Usage: node tools/syeddy-cli.mjs <command> [options]

Commands:
  submit          Submit a decision for mentor review
  history         Show decision history
  mentors         List all mentors (use --council to filter)
  mentor <id>     Show mentor details
  types           Show available decision types
  help            Show this help message

Submit Options:
  --type <TYPE>        Decision type (required, see 'types' command)
  --title <TITLE>      Decision title (required)
  --description <DESC> Decision description
  --urgency <LEVEL>    Urgency level (low|normal|high|critical)
  --by <NAME>          Who requested this decision
  --file <PATH>        Related file path
  --pr <NUMBER>        Related pull request number
  --commit <SHA>       Related commit SHA

Examples:
  # Submit a code change decision
  node tools/syeddy-cli.mjs submit --type CODE_CHANGE --title "Fix authentication bug" --description "Add null check" --file "api/routes/auth.mjs"

  # Submit a production deployment decision
  node tools/syeddy-cli.mjs submit --type PRODUCTION_DEPLOYMENT --title "Deploy v2.0.0" --urgency high --by "syeddy"

  # List all mentors
  node tools/syeddy-cli.mjs mentors

  # List mentors in Technical Council
  node tools/syeddy-cli.mjs mentors --council TECHNICAL

  # Show mentor details
  node tools/syeddy-cli.mjs mentor andrew-ng

  # Show decision history
  node tools/syeddy-cli.mjs history
`);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node tools/syeddy-cli.mjs help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
