# Implementation Plan - Add Archived Jobs to Performance Tab

The goal is to display a list of all archived jobs for a selected subcontractor or partner in the "Performance" tab of their detail view.

## User Request

"Change performance under contacts and under view in performance tab. It must show every job pulled from archive for a selected subcontractor or partner."

## Changes Implemented

### 1. `src/components/admin/subcontractor-detail.tsx`

- **State Management**: Added `archivedProjects` state to store the list of archived projects.
- **Data Fetching**: Updated the `loadDataFromSupabase` logic (specifically the project stats fetching) to:
  - Select all columns (`*`) instead of just `created_at`, `actual_start`, `status`.
  - Fetch related `project_work_types` and `project_additional_services` (to get price info if needed, though strictly just `amount` column from projects table is used for price display).
  - Filter the fetched projects to populate `archivedProjects` state where `status === 'Archived'`.
- **UI Update**: specificially in the `TabsContent value="performance"`:
  - Added a new `<Card>` below the existing "Monthly Jobs Overview" chart.
  - Inside the card, added a `<Table>` to display the list of archived jobs.
  - Columns: Project Name, Location, Date (Abnahme/Start/Created), Status, Amount.
  - Added empty state handling.

## Verification

- Validated that the file `src/components/admin/subcontractor-detail.tsx` imports necessary UI components (`Table`, `Badge`, `Card`, etc.).
- Ensured the fetch logic validates UUIDs to prevent errors.
- Verified that existing stats calculation remains functional with the expanded data fetch.
