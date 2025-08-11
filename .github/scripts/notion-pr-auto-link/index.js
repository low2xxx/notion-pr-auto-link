/**
 * Extract task ID from branch name
 * @param {string} branchName - The branch name to extract ID from
 * @param {string} [pattern] - Optional regex pattern (default: TASK-\d+)
 * @returns {string|null} - Extracted task ID or null if not found
 */
function extractTaskId(branchName, pattern = '(TASK-\\d+)') {
  const regex = new RegExp(pattern);
  const match = branchName.match(regex);
  return match ? match[1] : null;
}

module.exports = {
  extractTaskId
};