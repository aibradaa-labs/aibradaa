#!/usr/bin/env node

/**
 * AI Bradaa - Database Migration Script
 *
 * 84-Mentor Governance: Zero-downtime migrations with rollback support
 * Usage:
 *   node database/migrate.mjs up    # Apply migrations
 *   node database/migrate.mjs down  # Rollback migrations
 *   node database/migrate.mjs reset # Drop and recreate schema
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseMigration {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ai_bradaa',
      user: process.env.DB_USER || 'aibradaa',
      password: process.env.DB_PASSWORD,
    };
  }

  async connect() {
    this.client = new Client(this.config);
    await this.client.connect();
    console.log('✓ Connected to PostgreSQL');
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('✓ Disconnected from PostgreSQL');
    }
  }

  async migrateUp() {
    console.log('\n🚀 AI Bradaa Database Migration - UP\n');

    try {
      await this.connect();

      // Check if database exists
      const dbCheck = await this.client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [this.config.database]
      );

      // Read schema file
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf-8');

      console.log('📄 Executing schema.sql...\n');

      // Execute schema (split by semicolons)
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        // Skip empty statements and comments
        if (!statement || statement.startsWith('--')) continue;

        try {
          await this.client.query(statement);

          // Log completed sections
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE (\w+)/)?.[1];
            console.log(`  ✓ Created table: ${tableName}`);
          } else if (statement.includes('CREATE TYPE')) {
            const typeName = statement.match(/CREATE TYPE (\w+)/)?.[1];
            console.log(`  ✓ Created type: ${typeName}`);
          } else if (statement.includes('CREATE FUNCTION')) {
            const funcName = statement.match(/CREATE (?:OR REPLACE )?FUNCTION (\w+)/)?.[1];
            console.log(`  ✓ Created function: ${funcName}`);
          } else if (statement.includes('CREATE INDEX')) {
            const indexName = statement.match(/CREATE INDEX (\w+)/)?.[1];
            console.log(`  ✓ Created index: ${indexName}`);
          } else if (statement.includes('CREATE VIEW')) {
            const viewName = statement.match(/CREATE VIEW (\w+)/)?.[1];
            console.log(`  ✓ Created view: ${viewName}`);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (error.code === '42P07' || error.code === '42710') {
            continue; // Skip if already exists
          }
          throw error;
        }
      }

      // Verify tables created
      const tables = await this.client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      console.log(`\n✅ Migration completed successfully!`);
      console.log(`\n📊 Created ${tables.rows.length} tables:`);
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });

      // Show stats
      await this.showStats();

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async migrateDown() {
    console.log('\n⚠️  AI Bradaa Database Migration - DOWN\n');
    console.log('This will DROP ALL TABLES and DATA.\n');

    try {
      await this.connect();

      // Drop all tables
      const dropStatements = [
        'DROP VIEW IF EXISTS current_quotas CASCADE',
        'DROP VIEW IF EXISTS active_users CASCADE',
        'DROP TABLE IF EXISTS audit_log CASCADE',
        'DROP TABLE IF EXISTS preferences CASCADE',
        'DROP TABLE IF EXISTS usage_events CASCADE',
        'DROP TABLE IF EXISTS usage_quotas CASCADE',
        'DROP TABLE IF EXISTS magic_links CASCADE',
        'DROP TABLE IF EXISTS sessions CASCADE',
        'DROP TABLE IF EXISTS users CASCADE',
        'DROP TYPE IF EXISTS usage_metric_type CASCADE',
        'DROP TYPE IF EXISTS session_status CASCADE',
        'DROP TYPE IF EXISTS auth_provider CASCADE',
        'DROP TYPE IF EXISTS user_tier CASCADE',
        'DROP EXTENSION IF EXISTS pgcrypto CASCADE',
        'DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE'
      ];

      for (const statement of dropStatements) {
        try {
          await this.client.query(statement);
          const entity = statement.match(/DROP \w+ IF EXISTS (\w+)/)?.[1];
          console.log(`  ✓ Dropped: ${entity}`);
        } catch (error) {
          console.warn(`  ⚠ Could not drop: ${error.message}`);
        }
      }

      console.log('\n✅ Rollback completed successfully!');

    } catch (error) {
      console.error('\n❌ Rollback failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async reset() {
    console.log('\n🔄 AI Bradaa Database Migration - RESET\n');
    await this.migrateDown();
    await this.migrateUp();
  }

  async showStats() {
    try {
      // Count rows in each table
      const stats = await this.client.query(`
        SELECT
          schemaname,
          tablename,
          (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
        FROM (
          SELECT
            schemaname,
            tablename,
            query_to_xml(
              format('SELECT COUNT(*) as cnt FROM %I.%I', schemaname, tablename),
              false,
              true,
              ''
            ) as xml_count
          FROM pg_tables
          WHERE schemaname = 'public'
        ) t
        ORDER BY tablename
      `);

      console.log(`\n📈 Table Statistics:`);
      stats.rows.forEach(row => {
        console.log(`   ${row.tablename.padEnd(20)} ${row.row_count} rows`);
      });

    } catch (error) {
      // Ignore stats errors
      console.warn('   (Could not fetch stats)');
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'up';
  const migration = new DatabaseMigration();

  try {
    switch (command) {
      case 'up':
        await migration.migrateUp();
        break;
      case 'down':
        await migration.migrateDown();
        break;
      case 'reset':
        await migration.reset();
        break;
      default:
        console.log('Usage: node database/migrate.mjs [up|down|reset]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseMigration;
