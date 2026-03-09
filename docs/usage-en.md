# Usage Guide

## Breakeven Analysis

The Breakeven Analysis panel (collapsed by default) lets you evaluate whether a tournament entry is profitable based on ICM equity.

### Input Fields

- **Entry Fee**: The total amount paid to enter the tournament (e.g., $110).
- **Rake %**: The percentage of the entry fee taken by the operator (default: 10%). Buy-in and rake are auto-calculated from these two values.
- **Starting Chips**: The number of chips each player receives at the start of the tournament (e.g., 10,000).

### Output (Results Table)

- **Entry Fee**: The entry fee value for reference.
- **P/L (Profit/Loss)**: `ICM$ - Entry Fee`. Positive values indicate a profitable position.
- **ICM Premium**: The ratio of ICM equity to chip EV (`ICM$ / (stack × buy-in / starting_chips)`). Values > 1.0 indicate the player's chips are worth more than their linear chip value.

### Chart Integration

When breakeven is enabled:

- **Equity Bar Chart**: A red dashed horizontal line marks the entry fee level. Bars are color-coded: teal for players at or above breakeven, red for players below.
- **ICM Pressure Curve**: A red dashed horizontal line marks the entry fee level, showing where the curve crosses breakeven.

## Equity Bar Chart

Displays each player's ICM equity as a vertical bar chart.

- **Standard mode**: Single teal bars showing ICM$ per player.
- **Bounty/PKO mode**: Stacked bars with ICM$ (teal) and Bounty Equity (amber) portions.
- **With breakeven**: Bars change color based on whether the player's equity exceeds the entry fee. A legend is displayed showing dataset labels.

## ICM Pressure Curve

Visualizes the relationship between chip stack size and ICM$ value, demonstrating the diminishing marginal value of chips (ICM pressure).

- **X-axis**: Stack size in chips (with thousands separators).
- **Y-axis**: ICM$ value (formatted as dollar amounts).
- The curve shows how adding more chips yields progressively less ICM$ value — the fundamental insight behind ICM.
- **With breakeven**: A red dashed line at the entry fee level shows the breakeven threshold on the curve.
