// Red Phase: Test for NotionClient class
const assert = require('assert');

// Import the class (will fail initially)
let NotionClient;
try {
  const module = require('../notion-client.js');
  NotionClient = module.NotionClient;
} catch (error) {
  console.log('❌ Test failed: NotionClient module not found');
  process.exit(1);
}

// Test case 1: NotionClient exists
try {
  assert(NotionClient, 'NotionClient class should exist');
  console.log('✅ Test passed: NotionClient class exists');
} catch (error) {
  console.log('❌ Test failed: NotionClient class does not exist');
  process.exit(1);
}

// Test case 2: Can instantiate NotionClient
try {
  const client = new NotionClient('test-token');
  assert(client, 'Should create NotionClient instance');
  console.log('✅ Test passed: NotionClient can be instantiated');
} catch (error) {
  console.log('❌ Test failed: Cannot instantiate NotionClient');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);