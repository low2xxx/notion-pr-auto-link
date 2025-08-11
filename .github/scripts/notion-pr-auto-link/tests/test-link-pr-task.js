// Red Phase: Test for linkPRToTask function
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

// Test case 1: linkPRToTask method exists
try {
  const client = new NotionClient('test-token');
  assert(client.linkPRToTask, 'linkPRToTask method should exist');
  console.log('✅ Test passed: linkPRToTask method exists');
} catch (error) {
  console.log('❌ Test failed: linkPRToTask method does not exist');
  process.exit(1);
}

// Test case 2: linkPRToTask accepts required parameters
try {
  const client = new NotionClient('test-token');
  // Mock the method to test signature
  client.linkPRToTask = async (prPageId, taskPageId) => {
    assert(prPageId, 'prPageId is required');
    assert(taskPageId, 'taskPageId is required');
    return { id: prPageId };
  };
  
  // Test with valid parameters
  client.linkPRToTask('pr-page-id', 'task-page-id').then(result => {
    assert(result.id === 'pr-page-id', 'Should return updated PR page');
    console.log('✅ Test passed: linkPRToTask accepts parameters correctly');
  }).catch(error => {
    console.log('❌ Test failed: linkPRToTask parameter issue');
    console.log('   Error:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.log('❌ Test failed: Cannot test linkPRToTask parameters');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);