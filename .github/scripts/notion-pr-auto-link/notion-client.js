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
    
    // Title property - Add PR number prefix
    properties[config.prTitleProperty || 'Title'] = {
      title: [{
        text: {
          content: `#${prData.number} ${prData.title}`
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
    if (prData.taskPageId) {
      const relationProperty = config.taskRelationProperty || 'Related Task';
      properties[relationProperty] = {
        relation: [
          { id: prData.taskPageId }
        ]
      };
      console.log(`Adding task relation to PR creation:`);
      console.log(`  Task Page ID: ${prData.taskPageId}`);
      console.log(`  Relation Property: ${relationProperty}`);
    } else {
      console.log('No taskPageId provided, skipping relation');
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
  async linkPRToTask(prPageId, taskPageId, relationProperty = 'Related Task') {
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
    
    const propertyName = config.taskIdProperty || 'ID';
    console.log(`Searching for task "${taskId}" in property "${propertyName}"`);
    
    // Use unique_id search only when property is 'ID'
    if (propertyName === 'ID') {
      // Try unique_id search if taskId contains a number
      const match = taskId.match(/(\d+)$/);
      if (match) {
        const uniqueNumber = parseInt(match[1], 10);
        console.log(`Using unique_id search for number: ${uniqueNumber}`);
        
        try {
          const query = {
            database_id: databaseId,
            filter: {
              property: propertyName,
              unique_id: {
                equals: uniqueNumber
              }
            }
          };
          
          const response = await this._queryDatabase(query);
          if (response && response.results && response.results.length > 0) {
            // Verify the full ID matches
            const page = response.results[0];
            if (page.properties[propertyName]?.unique_id) {
              const uniqueId = page.properties[propertyName].unique_id;
              const fullId = `${uniqueId.prefix}-${uniqueId.number}`;
              if (fullId === taskId) {
                console.log(`Found task using unique_id search: ${fullId}`);
                return page;
              }
            }
          }
        } catch (error) {
          console.log(`unique_id search failed: ${error.message}`);
        }
      }
    }
    
    console.log('Task not found');
    return null;
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
      
      // Prepare properties to update
      const properties = {};
      
      // Update Title with PR number prefix
      if (prData.title) {
        properties[config.prTitleProperty || 'Title'] = {
          title: [{
            text: {
              content: `#${prData.number} ${prData.title}`
            }
          }]
        };
      }
      
      // Update State if provided
      if (prData.state) {
        properties[config.prStateProperty || 'State'] = {
          select: {
            name: prData.state
          }
        };
        console.log(`Updating PR state to: ${prData.state}`);
      }
      
      // Update relation if taskPageId is provided
      if (prData.taskPageId) {
        const relationProperty = config.taskRelationProperty || 'Related Task';
        properties[relationProperty] = {
          relation: [
            { id: prData.taskPageId }
          ]
        };
        console.log(`Updating task relation: ${prData.taskPageId}`);
      }
      
      // Update page if there are properties to update
      if (Object.keys(properties).length > 0) {
        console.log(`Updating existing PR page:`, properties);
        await this._updatePage(existingPage.id, properties);
      }
      
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