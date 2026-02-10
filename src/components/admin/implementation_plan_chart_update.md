# Implementation Plan - Enhance Monthly Jobs Overview with Graph

The user requested to change the "Monthly Jobs Overview" in the subcontractor detail view from a simple bar chart to a "graph or pie chart".

## Changes Implemented

### 1. `src/components/admin/subcontractor-detail.tsx`

- **Removed**: The manual `div`-based bar chart.
- **Added**: An SVG-based **Area Chart (Graph)**.
  - Used an SVG `<path>` with a `d` attribute calculated from the data points.
  - Added a linear gradient fill for a modern look.
  - Added an interactive overlay with tooltips that appear on hover.
  - Added a vertical hover line (`w-px`) for precise data inspection.
- **Why**: An Area/Line Chart is the most appropriate visualization for time-series data like "Monthly Jobs Overview". It clearly shows the trend over time, which was the previous chart's goal but executed more simply.

## Specific Implementation Details

- **Data Source**: Uses existing `projectStats` state (monthly data).
- **Visualization**:
  - X-Axis: Time (Months).
  - Y-Axis: specific values (Job Count).
  - Styling: Matches the application's primary color scheme with transparency gradients.
- **Interactivity**: Hover effects show the exact number of jobs for each month.

## Verification

- Verified that the new SVG chart replaces the old implementation correctly.
- Ensure linting compliance (fixed `w-[1px]` to `w-px`).
- The chart handles empty data states gracefully.
