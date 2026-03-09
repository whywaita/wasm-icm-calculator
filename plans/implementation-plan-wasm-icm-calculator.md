# Implementation Plan: WASM ICM Calculator

## Context

ポーカーMTT向けブラウザベースICM計算機。設計ドキュメント・仕様書・HTMLワイヤーフレームは完成済み。実装コードはゼロ。Rust/WASMエンジン + Preact UI + Web Worker の全スタックを新規構築する。

## Team「SOTA」構成と担当タスク

| Teammate | 専門領域 | 担当タスク |
|----------|---------|-----------|
| **general-purpose A** | Rust/WASM | Task 1, 2a, 2b, 2c, 3a, 3b, 3c, 4a |
| **general-purpose B** | Frontend | Task 1, 5a, 5b, 5c, 4b, 6a, 6b |
| **general-purpose C** | インフラ/統合 | Task 6c, 7a, 7b |
| **Plan** | 設計判断 | 実装中の設計判断が必要な場合にアドホック起動 |
| **Explore** | 調査 | ライブラリAPI調査、既存コード確認 |
| **Bash** | ビルド/テスト | 各タスク完了後の検証 (`cargo test`, `wasm-pack build`, `npm run build`) |

## タスク一覧

### Task 1: プロジェクトスキャフォールディング
**担当: general-purpose A + B (順次)**
**依存: なし**

- `icm-engine/Cargo.toml` — wasm-bindgen, serde, serde_json, getrandom(js), rand, proptest(dev)
- `icm-engine/src/lib.rs` — スタブ (`calculate`, `get_engine_info`)
- `web/package.json` — preact, chart.js, vite, @preact/preset-vite, typescript
- `web/vite.config.ts` — Preact + WASM プラグイン, base: `/wasm-icm-calculator/`
- `web/tsconfig.json`, `web/index.html`, `web/src/main.tsx`, `web/src/app.tsx`
- `.gitignore` — node_modules/, dist/, target/, pkg/, .worktrees/

**検証(Bash):** `cargo check` + `wasm-pack build --target web` + `npm run dev`

---

### Task 2a: Rust 型定義 + バリデーション
**担当: general-purpose A**
**依存: Task 1**

- `icm-engine/src/types.rs` — 全Rust型定義
  - `CalculationInput`, `TournamentType`, `PrizeStructure`, `PkoConfig`, `BreakevenInput`
  - `CalculationResult`, `PlayerResult`, `PressureCurvePoint`, `ResultMetadata`
  - `ValidationError`, `ErrorResponse`
- `icm-engine/src/validation.rs` — spec validation table準拠の全ルール
  - players数 2-50, stack > 0, bounty >= 0, payout合計チェック等
  - percentage payout ±0.01%許容 + 自動正規化
- `icm-engine/tests/validation_test.rs` — バリデーションテスト (TDD)

**検証(Bash):** `cargo test -- validation`

### Task 2b: 厳密ICM計算 (Malmuth-Harville)
**担当: general-purpose A**
**依存: Task 2a**

- `icm-engine/src/icm_exact.rs`
  - `HashMap<(usize, u32), f64>` ビットマスクメモ化
  - payout positions数で枝刈り (再帰深さ = paid positions数)
  - `fn compute_equity_exact(stacks: &[f64], payouts: &[f64]) -> Vec<f64>`
- `icm-engine/tests/icm_exact_test.rs` — TDD
  - proptest: Σ equity = prize pool (ε=1e-10)
  - proptest: chip leader = max equity, monotonicity, equal stacks = equal equity
  - known value: 3人 (5000, 3000, 2000) + payouts (50, 30, 20) vs HoldemResources

**検証(Bash):** `cargo test -- icm_exact`

### Task 2c: Monte Carlo近似計算
**担当: general-purpose A**
**依存: Task 2a**

- `icm-engine/src/icm_monte_carlo.rs`
  - 100,000 iterations, `SmallRng` + `getrandom` seed
  - ランダム脱落順序サンプリング（残スタック比例で脱落者選択）
  - `fn compute_equity_monte_carlo(stacks: &[f64], payouts: &[f64], iterations: u32) -> Vec<f64>`
- `icm-engine/tests/icm_mc_test.rs` — TDD
  - proptest: Σ equity = prize pool (ε=1e-2)
  - chip leader = max equity (確率的に成立)

**検証(Bash):** `cargo test -- icm_mc`

---

### Task 3a: Bounty KO計算
**担当: general-purpose A**
**依存: Task 2b or 2c**

- `icm-engine/src/bounty.rs`
  - `bounty_equity(i) = Σ_{j≠i} P(i KO j) * bounty(j)`
  - `P(i KO j) = stack_i / (stack_i + stack_j)`
  - `fn compute_bounty_equity(stacks: &[f64], bounties: &[f64]) -> Vec<f64>`
- `icm-engine/tests/bounty_test.rs` — TDD
  - bountyエクイティ保存則
  - chip leader = max bounty equity

**検証(Bash):** `cargo test -- bounty`

### Task 3b: PKO計算
**担当: general-purpose A**
**依存: Task 3a**

- `icm-engine/src/pko.rs`
  - 再帰PKOモデル: `r^depth < 0.1` で動的カットオフ
  - `fn compute_pko_bounty_equity(stacks: &[f64], bounties: &[f64], inheritance_rate: f64) -> Vec<f64>`
- `icm-engine/tests/pko_test.rs` — TDD
  - PKO equity >= standard bounty equity
  - inheritance_rate=0 → standard bountyに退化
  - r=0.5 で depth=4 カットオフ確認

**検証(Bash):** `cargo test -- pko`

### Task 3c: Breakeven + Pressure Curve + 統合calculate()
**担当: general-purpose A**
**依存: Task 2b, 2c, 3a, 3b**

- `icm-engine/src/breakeven.rs` — profit_loss, is_above_breakeven, icm_premium計算
- `icm-engine/src/pressure.rs` — ICM pressure curve (exact: 20点, MC: 50点)
- `icm-engine/src/lib.rs` — 統合 `calculate(input_json)` 関数完成
  - JSON入力デシリアライズ → バリデーション → タイプ別計算分岐 → 結果シリアライズ
- `icm-engine/tests/integration_test.rs` — JSON入出力の統合テスト

**検証(Bash):** `cargo test` (全テスト通過) + `wasm-pack build --target web`

---

### Task 4a: WASM バインディング
**担当: general-purpose A**
**依存: Task 3c**

- `icm-engine/src/lib.rs` — `#[wasm_bindgen]` 最終化
  - パニックキャッチ、`JsValue` エラー返却
  - `console_error_panic_hook` 設定

**検証(Bash):** `wasm-pack build icm-engine --target web --out-dir ../web/pkg`

### Task 4b: Web Worker + EngineClient
**担当: general-purpose B**
**依存: Task 4a (WASMビルド完了後)**

- `web/src/types.ts` — TypeScript型定義 (spec準拠、全interface)
- `web/src/worker.ts` — Web Worker
  - 遅延WASM初期化 (初回calculate時にinit())
  - postMessage プロトコル: `{type: "calculate", data}` → `{type: "result"/"error", ...}`
- `web/src/engine.ts` — `EngineClient` クラス
  - Worker ラッパー、Promise化、ライフサイクル管理

**検証(Bash):** `npm run build` 成功

---

### Task 5a: CSS抽出 + 入力系コンポーネント
**担当: general-purpose B**
**依存: Task 1**

`web/wireframe.html` から抽出:
- `web/src/styles/index.css` — wireframeのCSS (~440行) をそのまま抽出
- `web/src/components/Header.tsx` — ロゴ + 言語トグル
- `web/src/components/TournamentTypeSelector.tsx` — Standard/Bounty/PKO ラジオ
- `web/src/components/PlayerInput.tsx` — テーブル/CSV モード切替
  - `web/src/components/PlayerTable.tsx` — 編集可能テーブル (add/remove row)
  - `web/src/components/CsvInput.tsx` — テキストエリア (パース付き)

**検証(Bash):** `npm run dev` でコンポーネント描画確認

### Task 5b: 設定系 + ペイアウトコンポーネント
**担当: general-purpose B**
**依存: Task 5a**

- `web/src/components/PayoutStructure.tsx` — %, absolute切替 + プリセット + リアルタイム合計
- `web/src/components/PkoSettings.tsx` — inheritance rate入力 (PKO時のみ表示)
- `web/src/components/BreakevenInput.tsx` — 折りたたみ式, entry fee自動分割
- `web/src/components/CalculateButton.tsx` — 計算中disabled

**検証(Bash):** `npm run dev` で全入力フォーム動作確認

### Task 5c: 結果表示コンポーネント
**担当: general-purpose B**
**依存: Task 5a**

- `web/src/components/ResultsTable.tsx` — ソート可能テーブル (カラムヘッダクリック)
  - Standard: Name, Stack, Stack%, ICM$, ICM$%
  - Bounty/PKO: + Bounty Equity, Total Equity
  - Breakeven: + Entry Fee, Profit/Loss, ICM Premium
- `web/src/components/MetadataBar.tsx` — algorithm, playerCount, calculationTimeMs

**検証(Bash):** `npm run dev` でモックデータ表示確認

---

### Task 6a: i18n
**担当: general-purpose B**
**依存: Task 5a**

- `web/src/hooks/useI18n.ts` — カスタムJSONローダー, `t(key)` 関数, localStorage永続化
- `web/src/i18n/en.json` — 英語翻訳 (wireframe内のi18nオブジェクトから抽出)
- `web/src/i18n/ja.json` — 日本語翻訳
- エンジンエラーの翻訳マッピングテーブル含む

### Task 6b: Chart.js チャート + 全結合
**担当: general-purpose B**
**依存: Task 4b, 5b, 5c, 6a**

- `web/src/components/EquityChart.tsx` — Chart.js bar chart
  - tree-shaken: BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend
  - Bounty/PKO: stacked bar (ICM$ + Bounty)
- `web/src/components/PressureCurveChart.tsx` — Chart.js line chart
  - tree-shaken: LineController, LineElement, PointElement
  - プレイヤー実位置をドットで表示
- `web/src/hooks/useEngine.ts` — Worker ラッパーフック (`{ calculate, isLoading, error }`)
- `web/src/app.tsx` — 全コンポーネント結合
  - state管理: tournamentType, players[], payoutStructure, pkoConfig, breakevenInput, result, isCalculating, errors, language

**検証(Bash):** `npm run build` 成功 + ブラウザ動作確認

### Task 6c: Service Worker
**担当: general-purpose C**
**依存: Task 6b**

- `web/src/sw.ts` — キャッシュバスティングのみ (PWA非対応)
  - バージョン付きキャッシュ名、activate時に旧キャッシュ削除

---

### Task 7a: CI/CD
**担当: general-purpose C**
**依存: Task 6b**

- `.github/workflows/ci.yml` — cargo test, cargo fmt --check, cargo clippy, wasm-pack build, npm build
- `.github/workflows/deploy.yml` — main pushトリガー → GitHub Pages デプロイ
- `web/vite.config.ts` — 本番ビルド設定最終化

### Task 7b: ライセンス + 最終整備
**担当: general-purpose C**
**依存: Task 7a**

- `LICENSE` — Apache 2.0
- `README.md` — 基本的な使用方法

---

## 並列実行戦略

```
Task 1 (スキャフォールド)
   |
   +----> [Agent A: Rust] 2a → 2b → 2c → 3a → 3b → 3c → 4a
   |                                                        |
   +----> [Agent B: Frontend] 5a → 5b, 5c(並列) → 6a → 4b → 6b
   |                                                              |
   +--------------------------------------------------------------+---> [Agent C: インフラ] 6c → 7a → 7b
```

- **Agent A (Rust)**: Task 2a → 2b → 2c → 3a → 3b → 3c → 4a
- **Agent B (Frontend)**: Task 5a → (5b, 5c 並列) → 6a → 4b → 6b
- **Agent C (インフラ)**: Task 6c → 7a → 7b
- **Bash**: 各タスク完了後の検証を実行
- **Explore**: 必要に応じてライブラリ調査
- **Plan**: 設計判断が必要な場合にアドホック起動

## 重要参照ファイル

- `docs/design-spec.md` — 権威的仕様書 (FR-1〜15, NFR-1〜10)
- `docs/design-spec-decisions.md` — 22件の決定事項
- `web/wireframe.html` — UI参照 + CSS + i18n文字列
- `docs/design.md` — アルゴリズム擬似コード + テスト不変条件

## 検証方法

1. `cd icm-engine && cargo test` — 全プロパティベーステスト通過
2. `wasm-pack build icm-engine --target web` — WASMバイナリ生成
3. `cd web && npm run build` — フロントエンドビルド成功
4. ブラウザで動作確認: 3プレイヤー入力 → Calculate → 結果テーブル + チャート表示
5. HoldemResources参照値との比較 (Standard ICM, 3プレイヤー)
