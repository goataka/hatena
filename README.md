# hatena

Hatena Blog記事をGitHubで管理するためのリポジトリです。

## アップロード先

### goatakaブログ

<https://goataka.hatenablog.com/>

## 機能

- Markdown形式で記事を作成
- GitHub上で記事をバージョン管理
- 記事をコミット・プッシュすると自動的にはてなブログにアップロード

## セットアップ

### 1. はてなブログAPIキーの取得

1. はてなブログの設定画面にアクセス
2. 「詳細設定」→「APIキー」セクションで「APIキーを表示」
3. APIキーをコピー

### 2. GitHub Secretsの設定

このリポジトリの Settings → Secrets and variables → Actions で以下の3つのSecretを追加：

- `HATENA_ID`: はてなID (例: `goataka`)
- `BLOG_ID`: ブログID (例: `goataka.hatenablog.com`)
- `HATENA_API_KEY`: はてなブログAPIキー

## 記事の書き方

### 1. 新しい記事ファイルを作成

`articles/` ディレクトリに `.md` ファイルを作成します。

```bash
cp articles/template.md articles/my-new-article.md
```

### 2. Frontmatterとコンテンツを編集

記事ファイルの先頭にFrontmatterを記述します：

```markdown
---
title: 記事のタイトル
categories: [カテゴリー1, カテゴリー2]
draft: false
---

# 本文

記事の内容をMarkdownで書きます。
```

#### Frontmatterのオプション

- `title`: 記事のタイトル（必須）
- `categories`: カテゴリー/タグのリスト（オプション）
- `draft`: `true` で下書き、`false` で公開（デフォルト: `false`）

### 3. コミット＆プッシュ

```bash
git add articles/my-new-article.md
git commit -m "Add new article"
git push origin main
```

### 4. 自動アップロード

GitHub Actionsが自動的に実行され、新しい記事がはてなブログにアップロードされます。

- ワークフローの実行状況は「Actions」タブで確認できます
- 記事は自動的にはてなブログに投稿されます

## ローカルでのテスト

Node.js 20以上が必要です。

```bash
# 環境変数を設定
export HATENA_ID="your-hatena-id"
export BLOG_ID="your-blog-id.hatenablog.com"
export HATENA_API_KEY="your-api-key"

# 記事をアップロード
node scripts/upload-to-hatena.js articles/my-article.md
```

## トラブルシューティング

### アップロードが失敗する

- GitHub Secretsが正しく設定されているか確認
- APIキーが有効か確認
- 記事のFrontmatterが正しい形式か確認

### 記事が下書きとして投稿される

Frontmatterで `draft: false` を指定してください。

## ライセンス

記事の内容は各著者に帰属します。
