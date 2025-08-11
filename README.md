# Notion PR Auto Link

PRとNotionタスクを自動連携するGitHub Actionsワークフロー

## 概要

このGitHub Actionsワークフローは、Pull Request（PR）を作成・更新した際に、自動的にNotionデータベースと連携します。ブランチ名からタスクIDを抽出し、NotionのタスクデータベースとPRデータベースを相互にリンクすることで、プロジェクト管理を効率化します。

## 主な機能

- ブランチ名からタスクIDを自動抽出
- NotionのPRデータベースにPR情報を自動作成・更新
- タスクとPRの双方向リレーション設定
- PRにNotionページへのリンクを自動コメント
- PRのステータス変更を自動同期（Open/Draft/Merged/Closed）

## セットアップガイド

### 前提条件

- Notionアカウントとワークスペース
- GitHubリポジトリの管理者権限
- Notion API Integration Token

### ステップ1: Notion Integration の作成

1. [Notion Developers](https://www.notion.so/my-integrations) にアクセス
2. 「New integration」をクリック
3. Integration名を入力（例: `GitHub PR Link`）
4. ワークスペースを選択
5. 作成後、「Internal Integration Token」をコピー

### ステップ2: Notionデータベースの準備

#### PRデータベースの作成

以下のプロパティを持つデータベースを作成：

| プロパティ名 | タイプ | 必須 | 説明 |
|------------|-------|------|------|
| Title | タイトル | ✅ | PR のタイトル |
| PR Number | 数値 | ✅ | PR番号 |
| URL | URL | ✅ | GitHub PRへのリンク |
| State | セレクト | ✅ | Open, Draft, Merged, Closed |
| Author | テキスト | ✅ | PR作成者 |
| Created At | 日付 | ✅ | PR作成日時 |
| Related Task | リレーション | ✅ | タスクDBへのリレーション |

#### タスクデータベースの設定

既存のタスクデータベースに以下を追加：

| プロパティ名 | タイプ | 必須 | 説明 |
|------------|-------|------|------|
| ID | テキスト | ✅ | タスクの識別子（例: TASK-123） |
| Related PRs | リレーション | ✅ | PR DBへのリレーション（自動作成） |

#### データベースへのIntegration追加

1. 各データベースページ右上の「...」メニューをクリック
2. 「Add connections」を選択
3. 作成したIntegrationを選択して追加

### ステップ3: GitHub Secrets/Variablesの設定

リポジトリの Settings > Secrets and variables > Actions で設定：

#### Secrets（機密情報）
| Secret名 | 説明 | 例 |
|---------|------|-----|
| `NOTION_TOKEN` | Notion Integration Token | `secret_abc...` |
| `NOTION_PR_DB_ID` | PRデータベースのID | `abc123...` |
| `NOTION_TASK_DB_ID` | タスクデータベースのID | `def456...` |

#### Variables（公開可能な設定）※オプション
| Variable名 | 説明 | 例 |
|-----------|------|-----|
| `TASK_ID_PREFIX` | タスクIDプレフィックス | `JIRA` |
| `PR_TITLE_PROPERTY` | タイトルプロパティ名 | `タイトル` |
| `TASK_ID_PROPERTY` | タスクIDプロパティ名 | `タスクID` |

**データベースIDの取得方法：**
1. Notionでデータベースページを開く
2. URLをコピー: `https://notion.so/workspace/[DATABASE_ID]?v=...`
3. `[DATABASE_ID]`の部分（32文字）を使用

### ステップ4: ワークフローの導入

#### GitHub Actionとして使用

```yaml
name: PR to Notion

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review, closed]

jobs:
  link-to-notion:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: low2xxx/notion-pr-auto-link@main
        with:
          notion-token: ${{ secrets.NOTION_TOKEN }}
          pr-database-id: ${{ secrets.NOTION_PR_DB_ID }}
          task-database-id: ${{ secrets.NOTION_TASK_DB_ID }}
```

#### オプション: ファイルを直接コピー

カスタマイズが必要な場合:

```bash
# リポジトリをクローン
git clone https://github.com/low2xxx/notion-pr-auto-link.git

# 必要なファイルをコピー
cp -r notion-pr-auto-link/.github your-project/
```

## 使い方

### ブランチ命名規則

タスクIDを含むブランチ名を使用してください：

```bash
# デフォルトパターン（TASK-番号）
git checkout -b feature/TASK-123
git checkout -b fix/TASK-456-bug-fix
git checkout -b TASK-789/refactor

# カスタムプレフィックス使用時（例: JIRA）
git checkout -b feature/JIRA-123
git checkout -b hotfix/JIRA-456
```

### ワークフロー

1. **ブランチ作成**: タスクIDを含むブランチを作成
2. **PR作成**: GitHubでPull Requestを作成
3. **自動処理**: 
   - NotionのPRデータベースに新規ページ作成
   - タスクとPRを相互リンク
   - PRにNotionリンクをコメント
4. **ステータス同期**: PRの状態変更が自動的にNotionに反映

### 動作確認

PRを作成後、以下を確認：
- PRにNotionページへのリンクコメントが追加される
- NotionのPRデータベースに新規ページが作成される
- タスクページに「Related PRs」としてリンクされる

## カスタマイズ

### 環境変数

ワークフローファイル（`.github/workflows/notion-pr-link.yml`）で設定可能：

```yaml
env:
  # タスクIDのプレフィックス（デフォルト: TASK）
  TASK_ID_PREFIX: 'JIRA'
  
  # カスタムパターン（正規表現）
  TASK_ID_PATTERN: '(PROJ-\d{4})'
  
  # リレーションプロパティ名
  PR_RELATION_PROPERTY: 'Related PRs'
  TASK_RELATION_PROPERTY: 'Related Task'
```

### タスクIDパターンの例

| 組織 | プレフィックス | ブランチ例 | 設定 |
|-----|--------------|-----------|------|
| デフォルト | TASK | `feature/TASK-123` | 不要 |
| Jira | JIRA | `feature/JIRA-456` | `TASK_ID_PREFIX=JIRA` |
| カスタム | PROJ-#### | `fix/PROJ-0001` | `TASK_ID_PATTERN='(PROJ-\d{4})'` |

## トラブルシューティング

### よくある問題と解決方法

#### Notion API エラー

**症状**: `Notion API error: Unauthorized`

**解決方法**:
- Integration TokenがSecretsに正しく設定されているか確認
- データベースにIntegrationが追加されているか確認
- Tokenの有効期限を確認

#### タスクが見つからない

**症状**: PRは作成されるがタスクとリンクされない

**解決方法**:
- ブランチ名にタスクIDが含まれているか確認
- タスクデータベースの「Task ID」プロパティに正しい値が設定されているか確認
- `TASK_ID_PREFIX`または`TASK_ID_PATTERN`が正しく設定されているか確認

#### PRページが重複する

**症状**: 同じPRに対して複数のNotionページが作成される

**解決方法**:
- PRデータベースの「PR Number」プロパティが数値型であることを確認
- 既存のPRページを削除してから再実行

### デバッグ方法

1. **GitHub Actions のログ確認**:
   - リポジトリの Actions タブでワークフロー実行履歴を確認
   - 失敗したステップの詳細ログを展開

2. **ローカルテスト**:
   ```bash
   # 環境変数を設定
   export NOTION_TOKEN="your-token"
   export NOTION_PR_DB_ID="your-pr-db-id"
   export NOTION_TASK_DB_ID="your-task-db-id"
   
   # テスト実行
   node .github/scripts/notion-pr-auto-link/tests/test-config.js
   ```

## テスト

### ユニットテスト実行

```bash
# すべてのテストを実行
for f in .github/scripts/notion-pr-auto-link/tests/test-*.js; do
  node "$f"
done

# 個別テスト
node .github/scripts/notion-pr-auto-link/tests/test-extract-task-id.js
node .github/scripts/notion-pr-auto-link/tests/test-config.js
```

### 統合テスト

実際のNotion APIを使用したテスト（要環境変数）:

```bash
export NOTION_TOKEN="xxx"
export NOTION_PR_DB_ID="yyy"
export NOTION_TASK_DB_ID="zzz"
node .github/scripts/notion-pr-auto-link/tests/test-integration.js
```

## プロジェクト構成

```
action.yml                           # GitHub Action 定義
.github/
└── scripts/
    └── notion-pr-auto-link/
        ├── main.js                  # メインエントリーポイント
        ├── config.js                # 設定管理
        ├── index.js                 # タスクID抽出ユーティリティ
        ├── notion-client.js         # Notion API クライアント
        └── tests/                   # テストファイル
            ├── test-config.js
            ├── test-config-prefix.js
            ├── test-extract-task-id.js
            └── ...
```
