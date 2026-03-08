# Decisions: WASM ICM Calculator

## Decision Records

| # | カテゴリ | 質問 | 決定事項 | 根拠 |
|---|---------|------|---------|------|
| 1 | アルゴリズム | Monte Carlo の反復回数 | 固定 100,000 回 | 実装がシンプル、計算時間が予測可能。NFR-1 の < 1秒要件を満たせる。 |
| 2 | アルゴリズム | Bitmask memoization のメモリ管理 | payout positions 数で枝刈り（再帰は payout 数の深さまで） | payout が 5 位置なら再帰は 5 段まで → キャッシュサイズが劇的に減少。ICM の性質上これが正しい最適化。 |
| 3 | アルゴリズム | PKO 再帰カットオフ | `r^depth < 0.1` で動的カットオフ（r = inheritance rate） | inheritance rate が高い場合（例: 0.8）でも精度を保証。固定 3 人では r=0.8 で残存 51.2% が無視されるため。 |
| 4 | Worker ライフサイクル | WASM 初期化タイミング | 初回計算時に遅延ロード（spec 通り） | 初回ページロードの速度を優先。WASM バイナリのダウンロード+コンパイルは初回 Calculate クリック時。 |
| 5 | Worker ライフサイクル | 計算中の再実行 | 計算中はボタン無効化 | 最もシンプル。n=50 MC でも 100,000 回 × sub-second で完了するため待ち時間は許容範囲。 |
| 6 | Worker ライフサイクル | WASM 初期化失敗時の挙動 | 終端エラー（リトライなし） | WASM 未サポートブラウザではリトライしても無意味。シンプルな実装を優先。 |
| 7 | UI/UX | プレイヤースタック入力フロー | テーブル + CSV テキストエリア切替 | 少人数はテーブルで直感的に、大人数は CSV コピペで効率的に入力可能。 |
| 8 | UI/UX | Prize structure 入力補助 | リアルタイム合計表示 + 一般的な payout プリセット提供 | UX 向上。Out of Scope の "Input presets" は player stack プリセットを指し、payout プリセットは In Scope に含める。 |
| 9 | UI/UX | チャートライブラリ | Chart.js | 豊富なチャートタイプ（stacked bar、line）、大きなエコシステム。~60KB gzipped だが NFR-6 の WASM < 1MB とは別枠。 |
| 10 | 表示 | 数値表示精度 | ICM$ は小数点 2桁、% は 2桁、信頼区間なし | シンプルで見やすい。Monte Carlo の不確実性表示はユーザーを混乱させる可能性があるため v1 では省略。 |
| 11 | バリデーション | Percentage payout 合計の誤差許容 | ±0.01% 誤差許容 + 自動正規化 | 33.33 * 3 = 99.99 のようなケースでバリデーションエラーにならないようにする。正規化時は比率で各 payout を調整。 |
| 12 | エッジケース | 全プレイヤー同一スタック | 特別処理なし（通常のアルゴリズムで計算） | コードパスを減らしシンプルに保つ。Monte Carlo での微小差は実用上問題なし。 |
| 13 | i18n | 実装方式 | カスタム JSON ローダー、エンジンのエラーメッセージは英語固定で UI 側で翻訳 | エンジンが言語非依存になる。エラーコードまたは英語メッセージをキーにして UI 側の翻訳テーブルでマッピング。依存ライブラリ不要。 |
| 14 | アルゴリズム | ICM pressure curve 計算 | エンジン側で一括計算、ポイント数は動的（exact: 20点、MC: 50点）、全体で 1 本のカーブ | メモ化キャッシュを再利用して追加コストを抑える。カーブは `{stack: number, icmEquity: number}[]` 形式で返す。 |
| 15 | デプロイ | WASM キャッシュ戦略 | Service Worker でキャッシュバスティングのみ（オフラインページ開きは非スコープ） | 更新時に古いバージョンが使われるリスクを回避。完全オフライン対応（PWA）は v1 スコープ外。 |
| 16 | テスト | テスト戦略 | Rust 単体テスト + proptest による不変条件テスト | `Σ icmEquity = totalPrizePool` の不変条件をランダム入力で検証。WASM 結合テスト・E2E は v1 スコープ外。 |
| 17 | UI/UX | ICM Premium 表示 | 数値のみ表示（ツールチップ・色分け等の補助なし） | シンプル。ポーカープレイヤーは ICM premium の意味を理解している前提。 |
| 18 | UI/UX | CSV フォーマット | 統一フォーマット `name,stack,bounty`（bounty は省略可） | 全トーナメントタイプで同じフォーマット。Standard で bounty 列が省略された場合は無視。タイプ切替時もデータ保持。 |
| 19 | ビルド | WASM target | `wasm-pack --target web` | ES module 出力で Vite との統合が自然。Worker で `import()` でロード可能。 |
| 20 | アルゴリズム | Monte Carlo 乱数シード | ランダムシード（毎回微小変動） | 統計的に正しい。同じ入力での微小変動はユーザーに「近似計算である」ことを自然に伝える。 |
| 21 | UI/UX | テーブルソート | スタック降順デフォルト、カラムヘッダークリックでソート切替 | ポーカーではチップリーダーから見るのが自然。 |
| 22 | テスト | f64 精度許容値 | exact: 1e-10、Monte Carlo: 1e-2 | exact は浮動小数点誤差のみ。MC は 100,000 回での統計誤差を含むため緩い閾値。 |

## Open Questions

- [ ] **Monte Carlo 100,000 回の精度検証**: 100,000 回で NFR-1 の < 1秒要件を満たしつつ十分な精度が得られるか、ベンチマークで検証が必要
- [ ] **PKO 動的カットオフの閾値 0.1 の妥当性**: r=0.9 で depth=22 まで再帰する可能性がある。計算時間とのバランスを実装時に検証
- [ ] **Service Worker の更新フロー**: SW のバージョン管理と古いキャッシュの破棄タイミングの詳細設計
- [ ] **Pressure curve のスタック範囲**: X軸の範囲（0 〜 max stack）で 0 近辺は ICM$ がほぼ 0 になるため、有効範囲の決定が必要
- [ ] **Chart.js の tree-shaking**: Chart.js v4 は tree-shakable だが、必要なモジュールのみインポートする設定の検証が必要
- [ ] **CSV パースのエラーハンドリング**: 不正な CSV（列数不一致、非数値等）のエラーメッセージと表示方法の詳細

## Next Steps

- Out of Scope の「Input presets (v1)」を「Player stack presets (v1)」に修正し、payout プリセットを In Scope に追加
- CalculationResult 型に pressure curve データ構造を追加: `pressureCurve: {stack: number, icmEquity: number}[]`
- 仕様書（spec）の生成が必要な場合は `design-to-spec` を利用
