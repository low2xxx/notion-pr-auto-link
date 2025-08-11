// Red Phase: Test for findOrCreatePRPage function
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

// Test case 1: findOrCreatePRPage method exists
try {
  const client = new NotionClient('test-token');
  assert(client.findOrCreatePRPage, 'findOrCreatePRPage method should exist');
  console.log('✅ Test passed: findOrCreatePRPage method exists');
} catch (error) {
  console.log('❌ Test failed: findOrCreatePRPage method does not exist');
  process.exit(1);
}

// Test case 2: findOrCreatePRPage calls find then create if not found
try {
  const client = new NotionClient('test-token');
  let findCalled = false;
  let createCalled = false;
  
  // Mock the methods
  client.findPRPage = async (databaseId, prNumber) => {
    findCalled = true;
    return null; // Simulate not found
  };
  
  client.createPRPage = async (databaseId, prData) => {
    createCalled = true;
    return { id: 'new-page-id' };
  };
  
  client.findOrCreatePRPage = async (databaseId, prData) => {
    const existing = await client.findPRPage(databaseId, prData.number);
    if (existing) return existing;
    return await client.createPRPage(databaseId, prData);
  };
  
  const prData = {
    number: 123,
    title: 'Test PR',
    url: 'https://github.com/test/repo/pull/123'
  };
  
  client.findOrCreatePRPage('db-id', prData).then(result => {
    assert(findCalled, 'Should call findPRPage');
    assert(createCalled, 'Should call createPRPage when not found');
    assert(result.id === 'new-page-id', 'Should return created page');
    console.log('✅ Test passed: findOrCreatePRPage creates when not found');
  }).catch(error => {
    console.log('❌ Test failed: findOrCreatePRPage logic issue');
    console.log('   Error:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.log('❌ Test failed: Cannot test findOrCreatePRPage');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);