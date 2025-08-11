const assert = require('assert');
const config = require('../config.js');

console.log('Running config prefix tests...');

// Save original env vars
const originalToken = process.env.NOTION_TOKEN;
const originalPrDb = process.env.NOTION_PR_DB_ID;
const originalTaskDb = process.env.NOTION_TASK_DB_ID;
const originalPrefix = process.env.TASK_ID_PREFIX;
const originalPattern = process.env.TASK_ID_PATTERN;

// Set required env vars
process.env.NOTION_TOKEN = 'test-token';
process.env.NOTION_PR_DB_ID = 'test-pr-db';
process.env.NOTION_TASK_DB_ID = 'test-task-db';

// Test 1: Default prefix and pattern
delete process.env.TASK_ID_PREFIX;
delete process.env.TASK_ID_PATTERN;
try {
  const cfg = config.getConfig();
  assert.strictEqual(cfg.taskIdPrefix, 'TASK', 'Default prefix should be TASK');
  assert.strictEqual(cfg.taskIdPattern, '(TASK-\\d+)', 'Default pattern should be (TASK-\\d+)');
  console.log('✅ Test passed: Default prefix and pattern');
} catch (error) {
  console.log('❌ Test failed: Default prefix and pattern');
  console.log('   Error:', error.message);
  process.exit(1);
}

// Test 2: Custom prefix generates correct pattern
process.env.TASK_ID_PREFIX = 'JIRA';
delete process.env.TASK_ID_PATTERN;
try {
  const cfg = config.getConfig();
  assert.strictEqual(cfg.taskIdPrefix, 'JIRA', 'Custom prefix should be JIRA');
  assert.strictEqual(cfg.taskIdPattern, '(JIRA-\\d+)', 'Pattern should be generated from prefix');
  console.log('✅ Test passed: Custom prefix generates pattern');
} catch (error) {
  console.log('❌ Test failed: Custom prefix generates pattern');
  console.log('   Error:', error.message);
  process.exit(1);
}

// Test 3: Custom pattern overrides prefix-based pattern
process.env.TASK_ID_PREFIX = 'JIRA';
process.env.TASK_ID_PATTERN = '(PROJ-\\d{4})';
try {
  const cfg = config.getConfig();
  assert.strictEqual(cfg.taskIdPrefix, 'JIRA', 'Prefix should still be set');
  assert.strictEqual(cfg.taskIdPattern, '(PROJ-\\d{4})', 'Custom pattern should override');
  console.log('✅ Test passed: Custom pattern overrides');
} catch (error) {
  console.log('❌ Test failed: Custom pattern overrides');
  console.log('   Error:', error.message);
  process.exit(1);
}

// Restore original env vars
if (originalToken !== undefined) process.env.NOTION_TOKEN = originalToken;
else delete process.env.NOTION_TOKEN;
if (originalPrDb !== undefined) process.env.NOTION_PR_DB_ID = originalPrDb;
else delete process.env.NOTION_PR_DB_ID;
if (originalTaskDb !== undefined) process.env.NOTION_TASK_DB_ID = originalTaskDb;
else delete process.env.NOTION_TASK_DB_ID;
if (originalPrefix !== undefined) process.env.TASK_ID_PREFIX = originalPrefix;
else delete process.env.TASK_ID_PREFIX;
if (originalPattern !== undefined) process.env.TASK_ID_PATTERN = originalPattern;
else delete process.env.TASK_ID_PATTERN;

console.log('✅ All config prefix tests passed');
process.exit(0);