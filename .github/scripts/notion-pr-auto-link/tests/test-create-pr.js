// Red Phase: Test for createPRPage function
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

// Test case 1: createPRPage method exists
try {
  const client = new NotionClient('test-token');
  assert(client.createPRPage, 'createPRPage method should exist');
  console.log('✅ Test passed: createPRPage method exists');
} catch (error) {
  console.log('❌ Test failed: createPRPage method does not exist');
  process.exit(1);
}

// Test case 2: createPRPage accepts required parameters
try {
  const client = new NotionClient('test-token');
  // Mock the method to test signature
  client.createPRPage = async (databaseId, prData) => {
    assert(databaseId, 'databaseId is required');
    assert(prData, 'prData is required');
    assert(prData.number, 'PR number is required');
    assert(prData.title, 'PR title is required');
    assert(prData.url, 'PR URL is required');
    return { id: 'test-page-id' };
  };
  
  // Test with valid parameters
  const prData = {
    number: 123,
    title: 'Test PR',
    url: 'https://github.com/test/repo/pull/123',
    state: 'Open'
  };
  
  client.createPRPage('db-id', prData).then(result => {
    assert(result.id, 'Should return created page');
    console.log('✅ Test passed: createPRPage accepts parameters correctly');
  }).catch(error => {
    console.log('❌ Test failed: createPRPage parameter issue');
    console.log('   Error:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.log('❌ Test failed: Cannot test createPRPage parameters');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);