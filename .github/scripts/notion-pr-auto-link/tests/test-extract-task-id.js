// Red Phase: Test for extractTaskId function
const assert = require('assert');

// Import the function (will fail initially)
let extractTaskId;
try {
  const module = require('../index.js');
  extractTaskId = module.extractTaskId;
} catch (error) {
  console.log('❌ Test failed: Module not found');
  process.exit(1);
}

// Test case 1: Basic branch name
try {
  const result = extractTaskId('feature/TASK-40');
  assert.strictEqual(result, 'TASK-40');
  console.log('✅ Test passed: Basic branch name');
} catch (error) {
  console.log('❌ Test failed: Basic branch name');
  console.log('   Expected: TASK-40');
  console.log('   Actual:', error.message);
  process.exit(1);
}

// Test case 2: Exception branch name with suffix
try {
  const result = extractTaskId('feature/TASK-40-a');
  assert.strictEqual(result, 'TASK-40');
  console.log('✅ Test passed: Exception branch name with suffix');
} catch (error) {
  console.log('❌ Test failed: Exception branch name with suffix');
  console.log('   Expected: TASK-40');
  console.log('   Actual:', result);
  process.exit(1);
}

// Test case 3: No task ID in branch name
try {
  const result = extractTaskId('feature/no-task');
  assert.strictEqual(result, null);
  console.log('✅ Test passed: No task ID in branch name');
} catch (error) {
  console.log('❌ Test failed: No task ID in branch name');
  console.log('   Expected: null');
  console.log('   Actual:', result);
  process.exit(1);
}

console.log('✅ All tests passed');
process.exit(0);