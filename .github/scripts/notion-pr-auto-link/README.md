# Notion PR Auto Link

GitHub ActionsとNotion APIを連携して、PRを自動的にNotionタスクと紐付けるワークフローです。

## 機能

- ブランチ名からタスクIDを自動抽出
- PR用のNotionデータベースにPR情報を自動作成
- タスクデータベースとのリレーション自動設定
- PRにNotionページへのリンクをコメント

## セットアップ

### 1. Notion側の準備

#### PR データベースの作成
以下のプロパティを持つデータベースを作成:
- Title (タイトル)
- PR Number (数値)
- URL (URL)
- State (セレクト: Open, Draft, Merged, Closed)
- Author (テキスト)
- Created At (日付)
- Related Task (リレーション → タスクDB)

#### タスクデータベースの設定
- ID プロパティ (テキスト) が必要
- Related PRs プロパティ (リレーション → PR DB) が自動作成される

### 2. GitHub Secretsの設定

リポジトリのSettings > Secrets and variablesに以下を設定:

**必須:**
- `NOTION_TOKEN`: Notion Integration Token
- `NOTION_PR_DB_ID`: PR データベースのID
- `NOTION_TASK_DB_ID`: タスクデータベースのID

**オプション:**
- `TASK_ID_PREFIX`: タスクIDのプレフィックス

### 3. ブランチ命名規則

タスクIDが含まれるブランチ名を使用:
- 標準: `feature/TASK-40`
- 例外: `feature/TASK-40-a`

## 環境変数（オプション）

- `TASK_ID_PREFIX`: タスクIDのプレフィックス (デフォルト: `TASK`)
- `TASK_ID_PATTERN`: タスクID抽出パターン (デフォルト: プレフィックスベースで自動生成)
- `PR_RELATION_PROPERTY`: PR DB側のリレーションプロパティ名 (デフォルト: `Related PRs`)
- `TASK_RELATION_PROPERTY`: タスク DB側のリレーションプロパティ名 (デフォルト: `Related Task`)

### 設定例

```bash
# カスタムプレフィックスを使用
TASK_ID_PREFIX=JIRA  # JIRA-123 のようなタスクIDに対応

# 完全にカスタムパターンを使用
TASK_ID_PATTERN='(PROJ-\d{4})'  # PROJ-0001 のような形式に対応
```

## トリガーイベント

以下のPRイベントで自動実行:
- opened: PR作成時
- synchronize: PR更新時
- reopened: PR再オープン時
- ready_for_review: ドラフト解除時
- closed: PRクローズ/マージ時

## ファイル構成

```
.github/
├── workflows/
│   └── notion-pr-link.yml      # GitHub Actions ワークフロー
└── scripts/
    └── notion-pr-link/
        ├── index.js             # タスクID抽出
        ├── config.js            # 設定管理
        ├── notion-client.js     # Notion API クライアント
        ├── main.js              # メインスクリプト
        └── tests/               # テストファイル
            ├── test-extract-task-id.js
            ├── test-config.js
            ├── test-notion-client.js
            ├── test-find-pr.js
            ├── test-create-pr.js
            ├── test-find-or-create.js
            ├── test-find-task.js
            └── test-link-pr-task.js
```

## テスト実行

```bash
# 個別テスト
node .github/scripts/notion-pr-link/tests/test-extract-task-id.js
node .github/scripts/notion-pr-link/tests/test-config.js
node .github/scripts/notion-pr-link/tests/test-notion-client.js

# 統合テスト（要環境変数）
NOTION_TOKEN=xxx NOTION_PR_DB_ID=yyy NOTION_TASK_DB_ID=zzz node tests/test-integration.js
```

## トラブルシューティング

### Notion API エラー
- トークンの権限を確認
- データベースIDが正しいか確認
- プロパティ名が一致しているか確認

### タスクIDが見つからない
- ブランチ名にタスクIDが含まれているか確認
- TASK_ID_PATTERNが適切か確認

### リレーション設定失敗
- 両データベース間のリレーションが設定されているか確認
- プロパティ名が正しいか確認