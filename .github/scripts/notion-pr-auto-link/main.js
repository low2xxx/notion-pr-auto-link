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
    
    // Find task page first
    const taskPage = await notion.findTaskPage(config.taskDatabaseId, taskId, config);
    if (!taskPage) {
      console.log(`Task ${taskId} not found in Notion. Skipping.`);
      return;  // 処理を完全にスキップ
    }
    
    console.log(`Task page ID: ${taskPage.id}`);
    
    // Find or create PR page with task relation
    const prData = {
      number: prNumber,
      title: prTitle,
      url: prUrl,
      state: prState,
      authorName: authorName,
      createdAt: createdAt,
      taskPageId: taskPage.id  // タスクIDを追加
    };
    
    const prPage = await notion.findOrCreatePRPage(config.prDatabaseId, prData, config);
    console.log(`PR page ID: ${prPage.id}`);
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
    // タスクページが必須（見つからない場合はこの関数は呼ばれない）
    const taskPageUrl = `https://notion.so/${taskPage.id.replace(/-/g, '')}`;
    
    // タスクのタイトルを取得（最初のtextプロパティを探す）
    let taskTitle = 'Task';
    if (taskPage.properties) {
      // Title, Name, タイトル, 名前などの一般的なタイトルプロパティを探す
      const titleProps = ['Title', 'Name', 'タイトル', '名前', 'title', 'name'];
      for (const prop of titleProps) {
        if (taskPage.properties[prop]) {
          const titleProp = taskPage.properties[prop];
          if (titleProp.title && titleProp.title[0]) {
            taskTitle = titleProp.title[0].plain_text || titleProp.title[0].text?.content || 'Task';
            break;
          } else if (titleProp.rich_text && titleProp.rich_text[0]) {
            taskTitle = titleProp.rich_text[0].plain_text || titleProp.rich_text[0].text?.content || 'Task';
            break;
          }
        }
      }
    }
    
    // シンプルなコメント: タスクタイトル（リンク）
    const comment = `[${taskTitle}](${taskPageUrl})`;
    
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body: comment
    });
    
    console.log('Posted comment on PR with task link');
  } catch (error) {
    console.error('Error posting comment:', error);
    // Don't throw, as this is not critical
  }
}

module.exports = { main };