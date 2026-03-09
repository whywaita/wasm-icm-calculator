# ResultsTable 横幅不足の修正（日本語 + Bounty + Breakeven）

## Context

日本語ロケールでBountyトーナメント + Breakeven有効時、ResultsTableが最大10列になり、`.container` の `max-width: 860px`（実質820px）に収まらない。セル padding が各14px×2=28pxあり、10列で280pxがパディングだけで消費される。

## 方針

`.container` の `max-width` を広げる。現状860px → 1024pxに変更。これにより実質コンテンツ幅が820px → 984pxとなり、10列テーブルに十分な余裕が生まれる。

加えて、テーブルが将来的にさらに広くなった場合に備えて、テーブルを水平スクロール可能なラッパーで囲む。

## 対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `web/src/styles/index.css` | `.container` の `max-width` を `860px` → `1024px` に変更。`.results-table` の親に `overflow-x: auto` を追加 |

## 変更詳細

### 1. `.container` の max-width 拡大

```css
/* Before */
.container { max-width: 860px; }

/* After */
.container { max-width: 1024px; }
```

### 2. テーブルの水平スクロール対応

ResultsTableは `.card` で囲まれている。`.card` 内のテーブルが溢れた場合に備え、`.results-table` の親要素（`.card`）に `overflow-x: auto` を設定する。

```css
.card:has(.results-table) {
  overflow-x: auto;
}
```

## 検証

- agent-browserで日本語 + Bounty + Breakeven の状態を確認
- テーブルが横幅に収まり、はみ出しがないことを目視確認
- Standardモード（5列）でレイアウトが崩れないことも確認
