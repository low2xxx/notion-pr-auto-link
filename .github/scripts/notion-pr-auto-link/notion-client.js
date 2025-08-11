/**
 * Notion API Client wrapper
 */
class NotionClient {
  /**
   * Initialize Notion client
   * @param {string} token - Notion API token
   * @param {Object} config - Configuration object
   */
  constructor(token, config = {}) {
    if (!token) {
      throw new Error('Notion API token is required');
    }
    this.token = token;
    this.config = config;
    this.baseUrl = 'https://api.notion.com/v1';
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    };
  }

  /**
   * Find PR page by PR number
   * @param {string} databaseId - Notion database ID
   * @param {number} prNumber - GitHub PR number
   * @returns {Promise<Object|null>} PR page object or null if not found
   */
  async findPRPage(databaseId, prNumber, config = this.config) {
    if (!databaseId) throw new Error('databaseId is required');
    if (!prNumber) throw new Error('prNumber is required');
    
    const query = {
      database_id: databaseId,
      filter: {
        property: config.prNumberProperty || 'PR Number',
        number: {
          equals: prNumber
        }
      }
    };
    
    try {
      const response = await this._queryDatabase(query);
      return response.results.length > 0 ? response.results[0] : null;
    } catch (error) {
      console.error('Error finding PR page:', error);
      return null;
    }
  }

  /**
   * Create PR page in Notion database
   * @param {string} databaseId - Notion database ID
   * @param {Object} prData - PR data object
   * @returns {Promise<Object>} Created page object
   */
  async createPRPage(databaseId, prData, config = this.config) {
    if (!databaseId) throw new Error('databaseId is required');
    if (!prData) throw new Error('prData is required');
    if (!prData.number) throw new Error('PR number is required');
    if (!prData.title) throw new Error('PR title is required');
    if (!prData.url) throw new Error('PR URL is required');
    
    const properties = {};
    
    // Title property
    properties[config.prTitleProperty || 'Title'] = {
      title: [{
        text: {
          content: prData.title
        }
      }]
    };
    
    // PR Number property
    properties[config.prNumberProperty || 'PR Number'] = {
      number: prData.number
    };
    
    // URL property
    properties[config.prUrlProperty || 'URL'] = {
      url: prData.url
    };
    
    // State property
    properties[config.prStateProperty || 'State'] = {
      select: {
        name: prData.state || 'Open'
      }
    };
    
    // Task relation if taskPageId is provided
    if (prData.taskPageId && config.taskRelationProperty) {
      properties[config.taskRelationProperty || 'Related Task'] = {
        relation: [
          { id: prData.taskPageId }
        ]
      };
      console.log(`Adding task relation to PR creation: ${prData.taskPageId}`);
    }
    
    if (prData.authorName) {
      properties[config.prAuthorProperty || 'Author'] = {
        rich_text: [{
          text: {
            content: prData.authorName
          }
        }]
      };
    }
    
    if (prData.createdAt) {
      properties[config.prCreatedAtProperty || 'Created At'] = {
        date: {
          start: prData.createdAt
        }
      };
    }
    
    try {
      return await this._createPage(databaseId, properties);
    } catch (error) {
      console.error('Error creating PR page:', error);
      throw error;
    }
  }

  /**
   * Link PR page to Task page via relation
   * @param {string} prPageId - PR page ID
   * @param {string} taskPageId - Task page ID
   * @param {string} [relationProperty='Related Task'] - Name of relation property
   * @returns {Promise<Object>} Updated PR page object
   */
  async linkPRToTask(prPageId, taskPageId, relationProperty = 'Related Task', config = this.config) {
    if (!prPageId) throw new Error('prPageId is required');
    if (!taskPageId) throw new Error('taskPageId is required');
    
    console.log(`Linking PR ${prPageId} to Task ${taskPageId}`);
    console.log(`Using relation property: "${relationProperty}"`);
    
    const properties = {
      [relationProperty]: {
        relation: [
          { id: taskPageId }
        ]
      }
    };
    
    try {
      const result = await this._updatePage(prPageId, properties);
      console.log('Successfully linked PR to task');
      return result;
    } catch (error) {
      console.error('Error linking PR to task:', error.message);
      // より詳細なエラー情報を出力
      if (error.message && error.message.includes('validation_error')) {
        console.error('Validation error - check if relation property name is correct');
        console.error('Expected property name:', relationProperty);
      }
      throw error;
    }
  }

  /**
   * Find task page by task ID
   * @param {string} databaseId - Notion database ID
   * @param {string} taskId - ID value (e.g., TASK-40)
   * @returns {Promise<Object|null>} Task page object or null if not found
   */
  async findTaskPage(databaseId, taskId, config = this.config) {
    if (!databaseId) throw new Error('databaseId is required');
    if (!taskId) throw new Error('taskId is required');
    
    const query = {
      database_id: databaseId,
      filter: {
        property: config.taskIdProperty || 'ID',
        rich_text: {
          contains: taskId
        }
      }
    };
    
    try {
      const response = await this._queryDatabase(query);
      return response.results.length > 0 ? response.results[0] : null;
    } catch (error) {
      console.error('Error finding task page:', error);
      return null;
    }
  }

  /**
   * Find or create PR page
   * @param {string} databaseId - Notion database ID
   * @param {Object} prData - PR data object
   * @returns {Promise<Object>} Existing or created page object
   */
  async findOrCreatePRPage(databaseId, prData, config = this.config) {
    if (!databaseId) throw new Error('databaseId is required');
    if (!prData) throw new Error('prData is required');
    if (!prData.number) throw new Error('PR number is required');
    
    // First, try to find existing PR page
    const existingPage = await this.findPRPage(databaseId, prData.number, config);
    if (existingPage) {
      console.log(`Found existing PR page for PR #${prData.number}`);
      return existingPage;
    }
    
    // If not found, create new PR page
    console.log(`Creating new PR page for PR #${prData.number}`);
    return await this.createPRPage(databaseId, prData, config);
  }

  /**
   * Create page in Notion database (internal helper)
   * @private
   */
  async _createPage(databaseId, properties) {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        parent: { database_id: databaseId },
        properties: properties
      });

      const options = {
        hostname: 'api.notion.com',
        path: '/v1/pages',
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`Notion API error: ${result.message || data}`));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  /**
   * Update page properties (internal helper)
   * @private
   */
  async _updatePage(pageId, properties) {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ properties });

      const options = {
        hostname: 'api.notion.com',
        path: `/v1/pages/${pageId}`,
        method: 'PATCH',
        headers: {
          ...this.headers,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`Notion API error: ${result.message || data}`));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  /**
   * Query Notion database (internal helper)
   * @private
   */
  async _queryDatabase(query) {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.notion.com',
        path: '/v1/databases/' + query.database_id + '/query',
        method: 'POST',
        headers: this.headers
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify({ filter: query.filter }));
      req.end();
    });
  }
}

module.exports = {
  NotionClient
};