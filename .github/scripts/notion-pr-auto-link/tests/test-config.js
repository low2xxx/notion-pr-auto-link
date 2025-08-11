// Red Phase: Test for config module
const assert = require('assert');

// Import the config (will fail initially)
let config;
try {
  config = require('../config.js');
} catch (error) {
  console.log('❌ Test failed: config module not found');
  process.exit(1);
}

// Test case 1: getConfig function exists
try {
  assert(config.getConfig, 'getConfig function should exist');
  console.log('✅ Test passed: getConfig function exists');
} catch (error) {
  console.log('❌ Test failed: getConfig function does not exist');
  process.exit(1);
}

// Test case 2: Required environment variables check
const originalEnv = { ...process.env };

// Clear required env vars
delete process.env.NOTION_TOKEN;
delete process.env.NOTION_PR_DB_ID;
delete process.env.NOTION_TASK_DB_ID;

try {
  const cfg = config.getConfig();
  console.log('❌ Test failed: Should throw error when env vars missing');
  process.exit(1);
} catch (error) {
  if (error.message.includes('required')) {
    console.log('✅ Test passed: Throws error for missing env vars');
  } else {
    console.log('❌ Test failed: Wrong error type');
    console.log('   Error:', error.message);
    process.exit(1);
  }
}

// Test case 3: Config returns values when env vars set
process.env.NOTION_TOKEN = 'test-token';
process.env.NOTION_PR_DB_ID = 'test-pr-db';
process.env.NOTION_TASK_DB_ID = 'test-task-db';

try {
  const cfg = config.getConfig();
  assert.strictEqual(cfg.notionToken, 'test-token');
  assert.strictEqual(cfg.prDatabaseId, 'test-pr-db');
  assert.strictEqual(cfg.taskDatabaseId, 'test-task-db');
  console.log('✅ Test passed: Config returns correct values');
} catch (error) {
  console.log('❌ Test failed: Config values incorrect');
  console.log('   Error:', error.message);
  process.exit(1);
}

// Restore original environment
process.env = originalEnv;

console.log('✅ All tests passed');
process.exit(0);