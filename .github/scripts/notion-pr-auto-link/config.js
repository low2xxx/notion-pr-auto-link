/**
 * Configuration management for Notion PR Link
 */

/**
 * Get configuration from environment variables
 * @returns {Object} Configuration object
 * @throws {Error} If required environment variables are missing
 */
function getConfig() {
  const requiredEnvVars = [
    'NOTION_TOKEN',
    'NOTION_PR_DB_ID',
    'NOTION_TASK_DB_ID'
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Get task ID prefix from env or use default
  const taskIdPrefix = process.env.TASK_ID_PREFIX || 'TASK';
  
  // Build default pattern from prefix if not explicitly provided
  const defaultPattern = `(${taskIdPrefix}-\\d+)`;
  
  return {
    notionToken: process.env.NOTION_TOKEN,
    prDatabaseId: process.env.NOTION_PR_DB_ID,
    taskDatabaseId: process.env.NOTION_TASK_DB_ID,
    // Optional configurations
    taskIdPrefix: taskIdPrefix,
    taskIdPattern: process.env.TASK_ID_PATTERN || defaultPattern,
    prRelationProperty: process.env.PR_RELATION_PROPERTY || 'Related PRs',
    taskRelationProperty: process.env.TASK_RELATION_PROPERTY || 'Related Task'
  };
}

module.exports = {
  getConfig
};