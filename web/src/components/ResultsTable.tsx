import { useState, useMemo } from "preact/hooks";
import type { PlayerResult } from "../types";

interface ResultsTableProps {
  t: (key: string) => string;
  players: PlayerResult[];
  showBounty: boolean;
  showBreakeven: boolean;
}

type SortKey = string;

function getValue(p: PlayerResult, key: SortKey): number | string {
  switch (key) {
    case "name":
      return p.name ?? "";
    case "stack":
      return p.stack;
    case "stackPercentage":
      return p.stackPercentage;
    case "icmEquity":
      return p.icmEquity;
    case "icmEquityPercentage":
      return p.icmEquityPercentage;
    case "bountyEquity":
      return p.bountyEquity ?? 0;
    case "totalEquity":
      return p.totalEquity ?? 0;
    case "entryFee":
      return p.breakeven?.entryFee ?? 0;
    case "profitLoss":
      return p.breakeven?.profitLoss ?? 0;
    case "icmPremium": {
      if (!p.breakeven) return 0;
      const chipEv = p.stack * (p.breakeven.buyIn / 10000);
      return chipEv > 0 ? p.breakeven.icmDollar / chipEv : 0;
    }
    default:
      return 0;
  }
}

export function ResultsTable({
  t,
  players,
  showBounty,
  showBreakeven,
}: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedPlayers = useMemo(() => {
    if (!sortKey) return players;
    return [...players].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortAsc ? diff : -diff;
    });
  }, [players, sortKey, sortAsc]);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return (
      <span class="sort-indicator">{sortAsc ? " \u25B2" : " \u25BC"}</span>
    );
  };

  type Column = { key: SortKey; label: string };

  const columns: Column[] = [
    { key: "name", label: t("player") },
    { key: "stack", label: t("stack") },
    { key: "stackPercentage", label: t("stackPct") },
    { key: "icmEquity", label: t("icmDollar") },
    { key: "icmEquityPercentage", label: t("icmDollarPct") },
  ];

  if (showBounty) {
    columns.push({ key: "bountyEquity", label: t("bountyEq") });
    columns.push({ key: "totalEquity", label: t("totalEq") });
  }
  if (showBreakeven) {
    columns.push({ key: "entryFee", label: t("entryFeeCol") });
    columns.push({ key: "profitLoss", label: t("profitLoss") });
    columns.push({ key: "icmPremium", label: t("icmPrem") });
  }

  return (
    <div class="card">
      <table class="results-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => toggleSort(col.key)}>
                {col.label}
                {sortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, i) => {
            const be = p.breakeven;
            const pl = be?.profitLoss ?? 0;
            const icmPremium = (() => {
              if (!be) return 0;
              const chipEv = p.stack * (be.buyIn / 10000);
              return chipEv > 0 ? be.icmDollar / chipEv : 0;
            })();

            return (
              <tr key={i}>
                <td class="player-name">{p.name ?? `Player ${i + 1}`}</td>
                <td>{p.stack.toLocaleString()}</td>
                <td>{p.stackPercentage.toFixed(2)}%</td>
                <td class="val-gold">{p.icmEquity.toFixed(2)}</td>
                <td>{p.icmEquityPercentage.toFixed(2)}%</td>
                {showBounty && (
                  <>
                    <td class="val-accent">
                      {(p.bountyEquity ?? 0).toFixed(2)}
                    </td>
                    <td class="val-gold">
                      {(p.totalEquity ?? 0).toFixed(2)}
                    </td>
                  </>
                )}
                {showBreakeven && be && (
                  <>
                    <td>{be.entryFee.toFixed(2)}</td>
                    <td class={pl >= 0 ? "val-positive" : "val-negative"}>
                      {pl >= 0 ? "+" : ""}
                      {pl.toFixed(2)}
                    </td>
                    <td>{icmPremium.toFixed(2)}x</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
