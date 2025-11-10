# Schedule Export & Polish Features

Comprehensive documentation for BuildLight's schedule export functionality and final polish features.

## Table of Contents

1. [Export Functionality](#export-functionality)
2. [Components](#components)
3. [Utilities](#utilities)
4. [Hooks](#hooks)
5. [API Endpoints](#api-endpoints)
6. [Performance Optimizations](#performance-optimizations)
7. [Mobile Optimizations](#mobile-optimizations)
8. [Usage Examples](#usage-examples)
9. [Testing](#testing)

---

## Export Functionality

### Supported Export Formats

BuildLight supports exporting schedules in four formats:

#### 1. PDF Export (Gantt Chart)
- **Client-side rendering** using html2canvas + jsPDF
- Captures the visual Gantt chart layout
- Includes project name, schedule name, and generation date
- **Landscape orientation** recommended for best results
- **Use case**: Share visual timeline with stakeholders

```typescript
import { exportToPDF } from "@/lib/schedule-export";

await exportToPDF(
  "gantt-container", // Element ID
  "Q1 2024 Schedule",
  "Residential Build Project"
);
```

#### 2. CSV Export (Task List)
- **Server-side generation** using PapaParse
- Includes all task fields in tabular format
- Columns: Task Name, Phase, Start Date, End Date, Duration, Assignees, Progress, Tags, Dependencies, Notes, Color, Completed
- **Use case**: Import into Excel/Google Sheets for analysis

```typescript
// Server-side (API handles this)
POST /api/projects/[id]/schedules/[scheduleId]/export
Body: { format: "csv" }
```

#### 3. Excel Export (Multi-Sheet Workbook)
- **Server-side generation** using xlsx library
- **Three sheets**:
  - **Tasks**: Full task list with formatting
  - **By Phase**: Tasks grouped by construction phase
  - **By Assignee**: Workload distribution per team member
- Progress column formatted as percentage
- **Use case**: Detailed analysis and reporting

```typescript
// Server-side (API handles this)
POST /api/projects/[id]/schedules/[scheduleId]/export
Body: { format: "excel" }
```

#### 4. iCal Export (Calendar Format)
- **Server-side generation** using ics library
- Creates calendar events for each task
- Includes task details in event description
- Status: CONFIRMED (completed) or TENTATIVE (in progress)
- **Use case**: Import into Google Calendar, Outlook, Apple Calendar

```typescript
// Server-side (API handles this)
POST /api/projects/[id]/schedules/[scheduleId]/export
Body: { format: "ical" }
```

---

## Components

### ScheduleExportMenu
**Location**: `/components/schedule/schedule-export-menu.tsx`

Dropdown menu component for initiating exports.

**Props**:
- `projectId`: string
- `scheduleId`: string
- `scheduleName`: string
- `projectName`: string
- `tasks`: Task[]
- `ganttElementId?`: string (default: "gantt-container")
- `className?`: string

**Features**:
- Four export options with icons and descriptions
- Disabled state when no tasks
- Loading state during export
- Error handling with toast notifications
- Progress modal for large schedules (>50 tasks)

**Usage**:
```tsx
<ScheduleExportMenu
  projectId={project.id}
  scheduleId={schedule.id}
  scheduleName={schedule.name}
  projectName={project.name}
  tasks={tasks}
  ganttElementId="gantt-container"
/>
```

---

### ExportProgressModal
**Location**: `/components/schedule/export-progress-modal.tsx`

Modal showing export progress with estimated time.

**Props**:
- `isOpen`: boolean
- `format`: string
- `taskCount`: number
- `onCancel`: () => void

**Features**:
- Animated progress bar (0-100%)
- Status text updates (Preparing → Generating → Finalizing)
- Estimated time remaining
- Cancel button

**Progress Calculation**:
- PDF: 50ms per task + 1s base
- CSV: 5ms per task + 1s base
- Excel: 10ms per task + 1s base
- iCal: 5ms per task + 1s base

---

### ScheduleErrorBoundary
**Location**: `/components/schedule/schedule-error-boundary.tsx`

React Error Boundary for schedule components.

**Props**:
- `children`: ReactNode
- `fallback?`: ReactNode (optional custom fallback)
- `onError?`: (error, errorInfo) => void

**Features**:
- Catches errors in child components
- Shows user-friendly error message
- Logs errors to console and Sentry
- "Try Again" and "Reload Page" actions
- Development mode shows error stack trace

**Usage**:
```tsx
<ScheduleErrorBoundary>
  <GanttView tasks={tasks} />
</ScheduleErrorBoundary>
```

**With Fallback**:
```tsx
<ScheduleErrorBoundaryWithFallback fallbackView="list">
  <GanttView tasks={tasks} />
</ScheduleErrorBoundaryWithFallback>
```

---

### ScheduleLoadingSkeleton
**Location**: `/components/schedule/schedule-loading-skeleton.tsx`

Loading skeleton for schedule views.

**Props**:
- `viewMode?`: "gantt" | "list" | "calendar" (default: "gantt")

**Features**:
- Three skeleton variants: Gantt, List, Calendar
- Uses react-loading-skeleton for shimmer effect
- Matches layout of actual components

**Usage**:
```tsx
{loading ? (
  <ScheduleLoadingSkeleton viewMode="gantt" />
) : (
  <GanttView tasks={tasks} />
)}
```

**Additional Components**:
- `ScheduleLoadingSpinner`: Compact spinner
- `TaskCardSkeleton`: Individual task card skeleton

---

### ScheduleMetadata
**Location**: `/components/schedule/schedule-metadata.tsx`

Displays schedule statistics and metadata.

**Props**:
- `tasks`: Task[]
- `scheduleName`: string
- `className?`: string
- `compact?`: boolean (default: false)

**Features**:
- **Statistics**:
  - Total tasks
  - Completed tasks
  - Completion percentage
  - Total duration (days)
  - Team members count
  - Phases count
  - Dependencies count
- Start and end dates
- Overall progress bar
- Compact mode for inline display

**Usage**:
```tsx
<ScheduleMetadata
  tasks={tasks}
  scheduleName="Q1 2024 Schedule"
/>
```

**Compact Mode**:
```tsx
<ScheduleMetadata
  tasks={tasks}
  scheduleName="Q1 2024 Schedule"
  compact
/>
```

---

## Utilities

### schedule-export.ts
**Location**: `/lib/schedule-export.ts`

Core export utility functions.

**Functions**:

#### `exportToPDF()`
```typescript
async function exportToPDF(
  ganttElementId: string,
  scheduleName: string,
  projectName: string,
  options?: ExportOptions
): Promise<void>
```

#### `exportToCSV()`
```typescript
function exportToCSV(
  tasks: ExportTask[],
  scheduleName: string,
  options?: ExportOptions
): void
```

#### `exportToExcel()`
```typescript
function exportToExcel(
  tasks: ExportTask[],
  scheduleName: string,
  projectName: string,
  options?: ExportOptions
): void
```

#### `exportToICal()`
```typescript
function exportToICal(
  tasks: ExportTask[],
  scheduleName: string,
  projectName: string
): void
```

#### `prepareTasksForExport()`
```typescript
function prepareTasksForExport(
  tasks: Task[],
  userMap: Map<string, string>,
  taskMap: Map<string, Task>
): ExportTask[]
```

Enhances tasks with computed fields:
- `duration`: Days between start and end
- `progress`: 0-100 (or from task.completed)
- `assigneeNames`: User names from IDs
- `dependencyNames`: Task names from IDs

---

### schedule-validation.ts
**Location**: `/lib/schedule-validation.ts`

Validation utilities for task data.

**Functions**:

#### `validateTask()`
```typescript
function validateTask(
  task: Partial<Task>,
  allTasks?: Task[]
): ValidationResult
```

Validates:
- Required fields (name, dates)
- Date logic (start before end)
- Phase enum values
- Dependencies (existence, circular)
- Assignees count
- Tags count and length
- Color format (hex)
- Notes length

#### `validateTasks()`
```typescript
function validateTasks(tasks: Partial<Task>[]): ValidationResult
```

Batch validation with duplicate name detection.

#### `validateScheduleSettings()`
```typescript
function validateScheduleSettings(settings: any): ValidationResult
```

Validates schedule-level settings (workday hours, weekends).

**ValidationResult**:
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

**Example**:
```typescript
const result = validateTask(newTask, existingTasks);

if (!result.isValid) {
  console.error(formatValidationErrors(result));
  // Show errors to user
}
```

---

### mobile-utils.ts
**Location**: `/lib/mobile-utils.ts`

Mobile detection and optimization utilities.

**Key Functions**:

#### Device Detection
```typescript
isMobileDevice(): boolean
isTablet(): boolean
isMobileViewport(): boolean
getDeviceType(): "mobile" | "tablet" | "desktop"
isTouchDevice(): boolean
```

#### Schedule Optimizations
```typescript
getOptimalScheduleView(): "gantt" | "list" | "calendar"
shouldDisableGanttView(): boolean
getMinTouchTargetSize(): number  // 44px iOS, 48px Android
getOptimalRowHeight(): number
```

#### Configuration
```typescript
interface MobileScheduleConfig {
  defaultView: ScheduleViewMode;
  enableSwipeGestures: boolean;
  disableGanttView: boolean;
  minTouchTargetSize: number;
  rowHeight: number;
  enableBottomSheet: boolean;
  enablePullToRefresh: boolean;
}

getMobileScheduleConfig(): MobileScheduleConfig
```

#### Performance
```typescript
debounce<T>(func: T, wait: number): T
throttle<T>(func: T, limit: number): T
hasSlowNetwork(): boolean
getOptimalLoadingStrategy(): "eager" | "lazy" | "incremental"
```

**Example**:
```typescript
const config = getMobileScheduleConfig();

if (config.disableGanttView) {
  // Show list view only
  setViewMode("list");
}

if (config.enableSwipeGestures) {
  // Enable swipe to delete/edit
  enableSwipeHandlers();
}
```

---

## Hooks

### useScheduleUndoRedo
**Location**: `/hooks/use-schedule-undo-redo.ts`

Undo/redo functionality using Command Pattern.

**Usage**:
```typescript
const {
  canUndo,
  canRedo,
  undo,
  redo,
  execute,
  clear,
  getHistory
} = useScheduleUndoRedo(10); // Max 10 actions

// Create command
const command = updateTaskCommand(
  task.id,
  { name: "Old Name" },
  { name: "New Name" },
  updateTask
);

// Execute with history tracking
execute(command);

// Undo
if (canUndo) undo();

// Redo
if (canRedo) redo();
```

**Command Factory Functions**:
- `createTaskCommand()`
- `updateTaskCommand()`
- `deleteTaskCommand()`
- `moveTaskCommand()`
- `addDependencyCommand()`
- `removeDependencyCommand()`
- `bulkUpdateCommand()`
- `bulkDeleteCommand()`

---

### useScheduleKeyboardShortcuts
**Location**: `/hooks/use-schedule-keyboard-shortcuts.ts`

Keyboard shortcuts for schedule operations.

**Usage**:
```typescript
useScheduleKeyboardShortcuts({
  onNew: () => openCreateTaskModal(),
  onDelete: () => deleteSelectedTask(),
  onUndo: () => undo(),
  onRedo: () => redo(),
  onSave: () => saveSchedule(),
  onToggleCriticalPath: () => toggleCriticalPath(),
  onToggleBaseline: () => toggleBaseline(),
  onExport: () => openExportMenu(),
  onSearch: () => focusSearchInput(),
  onSelectAll: () => selectAllTasks(),
  onEscape: () => clearSelection(),
}, true); // enabled
```

**Shortcuts**:
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + N | Create new task |
| Delete | Delete selected task |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + S | Save |
| Ctrl/Cmd + K | Toggle critical path |
| Ctrl/Cmd + B | Toggle baseline |
| Ctrl/Cmd + E | Export |
| Ctrl/Cmd + F | Search |
| Ctrl/Cmd + A | Select all |
| Esc | Clear selection |

**Components**:
- `KeyboardShortcutsHelp`: List of shortcuts
- `KeyboardShortcutsButton`: Button to open help
- `KeyboardShortcutsModal`: Modal with shortcuts list

---

## API Endpoints

### POST /api/projects/[id]/schedules/[scheduleId]/export

**Location**: `/app/api/projects/[id]/schedules/[scheduleId]/export/route.ts`

Export schedule in specified format.

**Request**:
```typescript
{
  format: "pdf" | "csv" | "excel" | "ical",
  options?: {
    includeBaseline?: boolean,
    showCriticalPath?: boolean,
    dateRange?: {
      start: string,
      end: string
    },
    orientation?: "landscape" | "portrait"
  }
}
```

**Response** (CSV, Excel, iCal):
- Content-Type: appropriate MIME type
- Content-Disposition: attachment with filename
- Body: File content

**Response** (PDF):
```json
{
  "error": "PDF export must be done client-side",
  "message": "Please use the client-side PDF export function"
}
```

**Authentication**:
- Requires Clerk authentication
- Validates project access via organization membership

**Error Responses**:
- 401: Unauthorized
- 404: Project or schedule not found
- 400: Invalid format or options
- 500: Export generation failed

---

## Performance Optimizations

### Database Indexes

Add these indexes to improve query performance:

```prisma
// prisma/schema.prisma

model Task {
  // ...
  @@index([scheduleId, deletedAt])
  @@index([phase])
  @@index([completed])
}

model Schedule {
  // ...
  @@index([projectId, deletedAt])
  @@index([isBaseline])
  @@index([isOnline])
}
```

### Schedule Rendering

**For large schedules (>500 tasks)**:

1. **Lazy Loading**:
   - Paginate task list
   - Load 50 tasks at a time
   - Infinite scroll for more

2. **React Optimization**:
   ```typescript
   const TaskRow = React.memo(({ task }) => {
     // Component implementation
   });
   ```

3. **Debounced Updates**:
   ```typescript
   const debouncedUpdate = debounce(updateTask, 500);
   ```

4. **DHTMLX Optimization** (if using DHTMLX Gantt):
   ```typescript
   gantt.config.smart_rendering = true;
   gantt.config.static_background = true;
   ```

---

## Mobile Optimizations

### Responsive Design

1. **Default Views by Device**:
   - Mobile: List view (Gantt disabled)
   - Tablet: Calendar view
   - Desktop: Gantt view

2. **Touch Targets**:
   - Minimum 44px iOS, 48px Android
   - Larger row heights on mobile (72px)

3. **Gestures**:
   - Swipe left: Delete task
   - Swipe right: Edit task
   - Pull down: Refresh

4. **Bottom Sheet** (mobile):
   - Use bottom sheet instead of modal for task details
   - Native mobile feel

### CSS Media Queries

```css
/* Hide Gantt on mobile */
@media (max-width: 767px) {
  .gantt-view {
    display: none;
  }
}

/* Adjust touch targets */
@media (max-width: 767px) {
  .task-row {
    min-height: 72px;
  }

  button {
    min-width: 48px;
    min-height: 48px;
  }
}
```

---

## Usage Examples

### Complete Schedule Page Integration

```tsx
"use client";

import { useState, useEffect } from "react";
import { ScheduleExportMenu } from "@/components/schedule/schedule-export-menu";
import { ScheduleMetadata } from "@/components/schedule/schedule-metadata";
import { ScheduleErrorBoundary } from "@/components/schedule/schedule-error-boundary";
import { ScheduleLoadingSkeleton } from "@/components/schedule/schedule-loading-skeleton";
import { useScheduleKeyboardShortcuts } from "@/hooks/use-schedule-keyboard-shortcuts";
import { useScheduleUndoRedo } from "@/hooks/use-schedule-undo-redo";
import { getMobileScheduleConfig } from "@/lib/mobile-utils";

export default function SchedulePage({ projectId, scheduleId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("gantt");

  const mobileConfig = getMobileScheduleConfig();
  const { canUndo, canRedo, undo, redo, execute } = useScheduleUndoRedo();

  useScheduleKeyboardShortcuts({
    onNew: handleCreateTask,
    onDelete: handleDeleteTask,
    onUndo: undo,
    onRedo: redo,
    onSave: handleSave,
    onToggleCriticalPath: toggleCriticalPath,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  // Set optimal view mode for device
  useEffect(() => {
    setViewMode(mobileConfig.defaultView);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Schedule</h1>
        <div className="flex items-center gap-3">
          <ScheduleExportMenu
            projectId={projectId}
            scheduleId={scheduleId}
            scheduleName="Q1 2024"
            projectName="Residential Build"
            tasks={tasks}
          />
        </div>
      </div>

      {/* Metadata */}
      <ScheduleMetadata
        tasks={tasks}
        scheduleName="Q1 2024"
        className="mb-6"
      />

      {/* Schedule View */}
      <ScheduleErrorBoundary>
        {loading ? (
          <ScheduleLoadingSkeleton viewMode={viewMode} />
        ) : (
          <ScheduleView
            tasks={tasks}
            viewMode={viewMode}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
      </ScheduleErrorBoundary>
    </div>
  );
}
```

---

## Testing

### Manual Testing Checklist

#### Export Functionality
- [ ] PDF export generates and downloads
- [ ] PDF includes project name and date
- [ ] CSV export contains all task data
- [ ] CSV opens correctly in Excel
- [ ] Excel export has 3 sheets
- [ ] Excel formulas work
- [ ] iCal export imports to Google Calendar
- [ ] iCal events have correct dates

#### Error Handling
- [ ] Error boundary catches Gantt crashes
- [ ] Validation prevents invalid tasks
- [ ] Export errors show user-friendly messages

#### Performance
- [ ] 500-task schedule loads in <3 seconds
- [ ] Export progress modal shows for large schedules
- [ ] Mobile view is responsive

#### Keyboard Shortcuts
- [ ] Ctrl+N creates new task
- [ ] Ctrl+Z undos last action
- [ ] Delete key deletes selected task
- [ ] Shortcuts work across browsers

#### Mobile
- [ ] List view default on mobile
- [ ] Touch targets are 48px minimum
- [ ] Gantt view disabled on mobile
- [ ] Bottom sheet opens for task details

### Automated Testing

```typescript
// Example test for export validation
import { validateTask } from "@/lib/schedule-validation";

describe("validateTask", () => {
  it("should validate required fields", () => {
    const result = validateTask({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3); // name, startDate, endDate
  });

  it("should detect circular dependencies", () => {
    const tasks = [
      { id: "1", dependencies: ["2"] },
      { id: "2", dependencies: ["1"] },
    ];
    const result = validateTask(tasks[0], tasks);
    expect(result.errors.some(e => e.message.includes("circular"))).toBe(true);
  });
});
```

---

## Troubleshooting

### Common Issues

**1. PDF export is blurry**
- Solution: Increase `scale` in html2canvas options (default: 2)

**2. Excel export doesn't open**
- Solution: Check MIME type is correct (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

**3. iCal events show wrong times**
- Solution: Ensure dates are in correct timezone

**4. Mobile Gantt view is slow**
- Solution: Disable Gantt on mobile using `shouldDisableGanttView()`

**5. Undo/redo not working**
- Solution: Ensure commands are executed via `execute()` not called directly

---

## Future Enhancements

1. **Advanced Export Options**:
   - Date range filtering
   - Custom column selection for CSV
   - PDF templates (multiple layouts)

2. **Real-time Collaboration**:
   - WebSocket updates
   - Conflict resolution

3. **Offline Mode**:
   - Service worker caching
   - IndexedDB for offline storage

4. **Advanced Scheduling**:
   - Resource leveling
   - Critical chain method
   - What-if scenarios

---

## Credits

Built with:
- html2canvas: PDF generation
- jsPDF: PDF creation
- PapaParse: CSV parsing
- xlsx: Excel generation
- ics: iCal generation
- react-loading-skeleton: Loading states
- react-hotkeys-hook: Keyboard shortcuts

---

## License

Proprietary - BuildLight.io
