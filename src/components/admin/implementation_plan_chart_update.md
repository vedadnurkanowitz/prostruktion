# Chart Implementation Plan

## Goal

Update the "Monthly Jobs Overview" chart in the subcontractor detail view.
Original: Area Chart with SVG.
New: Candle-style Bar Chart with numerical labels on top.

## Changes

1.  **Component**: `src/components/admin/subcontractor-detail.tsx`
2.  **Visualization**:
    - Removed SVG Area Grapg.
    - Implemented a mapped `div` approach for "candles" or bars.
    - Each bar has a height proportional to the value relative to the max value (min 5).
    - Displayed the numerical value directly above each bar for clarity.
    - Added hover effects (scale, color change) for better interactivity.
3.  **Data**: Uses the existing `projectStats` state which aggregates monthly job counts.

## Implementation Details

- Loop through `projectStats`.
- Calculate `max` value for scaling.
- Render a flex container with items aligned to bottom (`items-end`).
- Each item contains:
  - Value Label (Top)
  - Bar Div (Middle, height %)
  - Month Name (Bottom)
