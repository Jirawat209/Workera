# Changelog

All notable changes to this project will be documented in this file.

## [v1.1-beta] - 2026-02-12

### 🚀 New Features
-   **Recently Visited Boards**:
    -   Real-time tracking of visited boards.
    -   Smart sorting (Newest first).
    -   Enhanced Card UI with Owner and Workspace details.
-   **Notification System**:
    -   Improved "Invite" flow (Requires Acceptance).
    -   Fixed sync issues between read status and DB.
    -   Real-time updates for new notifications.

## [v1.0-beta] - 2026-02-10

### 🚀 Released
-   **Full Work Management System**: Complete board, group, and item management.
-   **Views**: Main Table, Kanban, Calendar, Dashboard, and Gantt charts.
-   **Column Types**: Status, Priority, Date, Timeline, People, Numbers, Checkbox, Link, Dropdown.
-   **Admin Console**: User management, Workspace management, and System stats.
-   **Export System**:
    -   Board Export to CSV (Full data fidelity).
    -   System-wide JSON Backup & Restore (Admin only).
-   **Activity Logs**: Detailed tracking of item updates, creation, and deletion.

### 🐛 Fixed
-   **CSV Export**: Resolved issues with empty cells and missing labels for Status/Dropdown columns.
-   **Excel Export**: Reverted to CSV for better compatibility and performance.
-   **File Downloads**: Implemented IDM-compatible download handling.
