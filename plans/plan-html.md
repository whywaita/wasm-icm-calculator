# Plan: ワイヤーフレーム HTML — 全画面デザイン確認

## Context

design-spec.md の UI 仕様を、ワイヤーフレーム的な HTML で可視化する。Rust/WASM 実装は含めない。CSS スタイリングは最小限（要素の配置・構造確認が目的）。全トーナメントタイプ（Standard/Bounty/PKO）+ Breakeven 分析の入力フォームと結果表示を含む。

## 作成ファイル

### `web/wireframe.html`（単一ファイル）

CSS と JS をインラインで含む単一 HTML ファイル。

## 画面構成

### 1. ヘッダー
- タイトル: "ICM Calculator"
- 言語切替: EN / JA トグル（表示切替のみ、翻訳はプレースホルダー）

### 2. トーナメントタイプ選択（FR-1）
- Radio: Standard / Bounty / PKO
- 選択に応じて表示フィールドが変わる:
  - Standard: スタック + ペイアウト
  - Bounty: + バウンティ値列
  - PKO: + バウンティ値列 + 継承率

### 3. プレイヤー入力（FR-2）
- **テーブルモード**: 行ごとに Name / Stack / Bounty（Bounty/PKO時のみ表示）
  - 「+ Add Player」「- Remove」ボタン
  - 初期 3行
- **CSVモード**: textarea（`name,stack,bounty` フォーマット）
- モード切替ボタン（Table ⇔ CSV）

### 4. ペイアウト構造入力（FR-3）
- タイプ選択: Percentage / Absolute
- 入力行: Position / Amount
- **リアルタイム合計表示**（running total）
- プリセットドロップダウン: 50/30/20, 標準 MTT 等
- totalPrizePool 入力（Percentage 選択時）

### 5. PKO 設定（FR-5, PKO 時のみ表示）
- Inheritance Rate: number input（default: 0.5）

### 6. Breakeven 分析（FR-10, 折りたたみセクション）
- Entry Fee 入力
- Rake % 入力（default: 10%）→ Buy-in / Rake 自動計算表示
- Starting Chips 入力

### 7. Calculate ボタン（FR-6）
- 押下で結果セクションを表示（ダミーデータ）

### 8. 結果表示（FR-11, FR-12, FR-13）

#### 結果テーブル
- **Standard カラム**: Player / Stack / Stack% / ICM$ / ICM$%
- **Bounty/PKO カラム**: + Bounty Equity / Total Equity
- **Breakeven カラム**: + Entry Fee / Profit/Loss / ICM Premium
- カラムヘッダークリックでソート方向表示（実際のソートは不要）

#### チャートプレースホルダー
- Equity Bar Chart: `[Chart: Equity Bar]` プレースホルダー div
- ICM Pressure Curve: `[Chart: Pressure Curve]` プレースホルダー div

### 9. メタデータ表示
- Algorithm: exact / approximate
- Player Count
- Calculation Time

## JS の範囲（最小限）

- トーナメントタイプ切替 → Bounty/PKO フィールドの表示/非表示
- テーブル行の追加/削除
- Table ⇔ CSV モード切替
- Payout タイプ切替 → totalPrizePool 表示/非表示
- Breakeven セクション折りたたみ
- Calculate ボタン → ダミーデータで結果セクション表示
- 結果テーブルのカラムはタイプに応じて動的変更

## ダミーデータ

Calculate 押下時に表示するハードコードデータ:

```
Players: Alice(5000), Bob(3000), Carol(2000)
Payouts: 50/30/20 (totalPrizePool: 1000)
→ ICM$: Alice=420.83, Bob=312.50, Carol=266.67
（3人の HoldemResources 参考値に近い値）

Bounty追加: bounties=[10,10,10]
→ bountyEquity: Alice=6.25, Bob=3.75, Carol=2.50
→ totalEquity: Alice=427.08, Bob=316.25, Carol=269.17

Breakeven: entryFee=110, rake=10, startingChips=10000
→ profitLoss, isAboveBreakeven 算出
```

## 検証方法

1. `web/wireframe.html` をブラウザで直接開く（サーバ不要）
2. 各トーナメントタイプを切り替え → フィールド表示/非表示が正しいか
3. 行追加/削除が動作するか
4. Table ⇔ CSV 切替が動作するか
5. Calculate → ダミーデータの結果テーブルが表示されるか
6. 全要素の配置が design-spec.md のフロー（FR-1〜FR-15）と整合するか

## 参照仕様

- `docs/design-spec.md`: FR-1〜FR-15（全 Functional Requirements）
- `docs/design.md`: User Flow セクション、Input Fields セクション
