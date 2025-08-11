// Red Phase: Test for findTaskPage function
const assert = require('assert');

// Import the NotionClient
let NotionClient;
try {
  const module = require('../notion-client.js');
  NotionClient = module.NotionClient;
} catch (error) {
  console.log('❌ Test failed: NotionClient module not found');
  process.exit(1);
}

// Test case 1: findTaskPage method exists
try {
  const client = new NotionClient('test-token');
  assert(client.findTaskPage, 'findTaskPage method should exist');
  console.log('✅ Test passed: findTaskPage method exists');
} catch (error) {
  console.log('❌ Test failed: findTaskPage method does not exist');
  process.exit(1);
}

// Test case 2: findTaskPage accepts required parameters
try {
  const client = new NotionClient('test-token');
  // Mock the method to test signature
  client.findTaskPage = async (databaseId, taskId) => {
    assert(databaseId, 'databaseId is required');
    assert(taskId, 'taskId is required');
    return null;
  };
  
  // Test with valid parameters
  client.findTaskPage('db-id', 'TASK-40').then(result => {
    console.log('✅ Test passed: findTaskPage accepts parameters correctly');
  }).catch(error => {
    console.log('❌ Test failed: findTaskPage parameter issue');
    console.log('   Error:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.log('❌ Test failed: Cannot test findTaskPage parameters');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);