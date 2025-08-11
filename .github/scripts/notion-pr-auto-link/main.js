/**
 * Main script for Notion PR Auto Link
 * This script is called from GitHub Actions workflow
 */

const { getConfig } = require('./config');
const { extractTaskId } = require('./index');
const { NotionClient } = require('./notion-client');

/**
 * Main function to link PR to Notion task
 * @param {Object} context - GitHub context object
 * @param {Object} github - GitHub API client
 */
async function main(context, github) {
  try {
    // Get configuration
    const config = getConfig();
    
    // Extract PR information
    const pr = context.payload.pull_request;
    const branchName = pr.head.ref;
    const prNumber = pr.number;
    const prTitle = pr.title;
    const prUrl = pr.html_url;
    const prState = pr.draft ? 'Draft' : pr.merged ? 'Merged' : pr.state === 'closed' ? 'Closed' : 'Open';
    const authorName = pr.user.login;
    const createdAt = pr.created_at;
    
    console.log(`Processing PR #${prNumber}: ${prTitle}`);
    console.log(`Branch: ${branchName}`);
    console.log(`State: ${prState}`);
    
    // Extract task ID from branch name
    const taskId = extractTaskId(branchName, config.taskIdPattern);
    if (!taskId) {
      console.log('No task ID found in branch name. Skipping.');
      return;
    }
    
    console.log(`Found task ID: ${taskId}`);
    
    // Initialize Notion client with config
    const notion = new NotionClient(config.notionToken, config);
    
    // Find or create PR page
    const prData = {
      number: prNumber,
      title: prTitle,
      url: prUrl,
      state: prState,
      authorName: authorName,
      createdAt: createdAt
    };
    
    const prPage = await notion.findOrCreatePRPage(config.prDatabaseId, prData, config);
    console.log(`PR page ID: ${prPage.id}`);
    
    // Find task page
    const taskPage = await notion.findTaskPage(config.taskDatabaseId, taskId, config);
    if (!taskPage) {
      console.log(`Task ${taskId} not found in Notion. Skipping relation.`);
      // Still post comment about PR page creation
      await postComment(github, context, prPage, null);
      return;
    }
    
    console.log(`Task page ID: ${taskPage.id}`);
    
    // Link PR to task
    await notion.linkPRToTask(prPage.id, taskPage.id, config.taskRelationProperty, config);
    console.log('Successfully linked PR to task');
    
    // Post comment on PR
    await postComment(github, context, prPage, taskPage);
    
  } catch (error) {
    console.error('Error in main function:', error);
    throw error;
  }
}

/**
 * Post comment on GitHub PR
 */
async function postComment(github, context, prPage, taskPage) {
  try {
    const prPageUrl = `https://notion.so/${prPage.id.replace(/-/g, '')}`;
    let comment = `✅ PR has been linked to Notion\n\n`;
    comment += `📝 [PR Page in Notion](${prPageUrl})\n`;
    
    if (taskPage) {
      const taskPageUrl = `https://notion.so/${taskPage.id.replace(/-/g, '')}`;
      comment += `🎯 [Task Page in Notion](${taskPageUrl})\n`;
    }
    
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body: comment
    });
    
    console.log('Posted comment on PR');
  } catch (error) {
    console.error('Error posting comment:', error);
    // Don't throw, as this is not critical
  }
}

module.exports = { main };