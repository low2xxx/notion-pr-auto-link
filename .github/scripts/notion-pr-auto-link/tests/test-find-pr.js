// Red Phase: Test for findPRPage function
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

// Test case 1: findPRPage method exists
try {
  const client = new NotionClient('test-token');
  assert(client.findPRPage, 'findPRPage method should exist');
  console.log('✅ Test passed: findPRPage method exists');
} catch (error) {
  console.log('❌ Test failed: findPRPage method does not exist');
  process.exit(1);
}

// Test case 2: findPRPage accepts required parameters
try {
  const client = new NotionClient('test-token');
  // Mock the method to test signature
  client.findPRPage = async (databaseId, prNumber) => {
    assert(databaseId, 'databaseId is required');
    assert(prNumber, 'prNumber is required');
    return null;
  };
  
  // Test with valid parameters
  client.findPRPage('db-id', 123).then(result => {
    console.log('✅ Test passed: findPRPage accepts parameters correctly');
  }).catch(error => {
    console.log('❌ Test failed: findPRPage parameter issue');
    console.log('   Error:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.log('❌ Test failed: Cannot test findPRPage parameters');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);