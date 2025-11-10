# Task Management UI Components

Comprehensive React components for BuildLight task creation, editing, and management with DHTMLX Gantt integration.

## Overview

This directory contains all the UI components needed to build a complete task management interface for construction project scheduling. All components are built with TypeScript, use BuildLight's brand colors, and follow a Swiss minimal design aesthetic.

## Components

### Core Form Components

#### PhaseSelector
Dropdown for selecting construction phases with color indicators.

```tsx
import { PhaseSelector } from "@/components/schedule/phase-selector";

<PhaseSelector
  value={phase}
  onChange={(phase, color) => {
    setPhase(phase);
    setColor(color); // Auto-fills with phase color
  }}
  required
/>
```

**Features:**
- 14 construction phases (PLANNING → CLOSEOUT)
- Color indicator dot for each phase
- Auto-fills task color with phase color
- User can override color

#### TagInput
Multi-select tag input with common tag suggestions.

```tsx
import { TagInput } from "@/components/schedule/tag-input";

<TagInput
  value={tags}
  onChange={setTags}
  maxTags={10}
/>
```

**Features:**
- Common tags: Invoice-Driver, Designer, Inspection, Delivery, Milestone
- Custom tag support
- Max 10 tags per task
- Pills with X to remove
- Keyboard navigation (Enter to add, Backspace to remove last)

#### TeamMemberSelector
Multi-select dropdown for assigning team members.

```tsx
import { TeamMemberSelector } from "@/components/schedule/team-member-selector";

<TeamMemberSelector
  projectId={projectId}
  value={assignees}
  onChange={setAssignees}
/>
```

**Features:**
- Shows avatar + name + role
- Selected members as avatar chips
- Fetches project members from API
- Multi-select support

#### DateRangePicker
Date picker with workday calculation support.

```tsx
import { DateRangePicker } from "@/components/schedule/date-range-picker";

<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>
```

**Features:**
- Two modes: End Date or Duration
- Workday calculations (excludes weekends & US holidays)
- Toggle between modes
- Visual feedback for weekend days
- Date range summary with workday count

#### TaskDependencySelector
Dependency management with circular detection.

```tsx
import { TaskDependencySelector } from "@/components/schedule/task-dependency-selector";

<TaskDependencySelector
  projectId={projectId}
  scheduleId={scheduleId}
  currentTaskId={taskId} // Optional: for editing existing tasks
  value={dependencies}
  onChange={setDependencies}
  maxDependencies={3}
/>
```

**Features:**
- Up to 3 predecessor tasks
- Two dependency types: FINISH_TO_START, START_TO_START
- Circular dependency detection with DFS
- Clear error messages showing circular path
- Add/remove dependency slots

### Modal Components

#### CreateTaskModal
Comprehensive modal for creating new tasks.

```tsx
import { CreateTaskModal } from "@/components/schedule/create-task-modal";

<CreateTaskModal
  projectId={projectId}
  scheduleId={scheduleId}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onTaskCreated={(task) => {
    console.log("Task created:", task);
    // Handle success (e.g., refresh task list)
  }}
/>
```

**Form Fields:**
- Task Name (required, max 200 chars)
- Description (optional, max 500 chars)
- Phase (required)
- Start Date (required)
- End Date or Duration (required)
- Assignees (multi-select)
- Tags (multi-select, max 10)
- Color (auto-fills from phase)
- Dependencies (max 3)
- Notes (optional, max 2000 chars)

**Features:**
- Client-side validation
- Server-side validation error display
- Loading states
- Auto-close on success

#### EditTaskModal
Modal for editing existing tasks with delete functionality.

```tsx
import { EditTaskModal } from "@/components/schedule/edit-task-modal";

<EditTaskModal
  projectId={projectId}
  scheduleId={scheduleId}
  task={task}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onTaskUpdated={(updatedTask) => {
    console.log("Task updated:", updatedTask);
  }}
  onTaskDeleted={(taskId) => {
    console.log("Task deleted:", taskId);
  }}
/>
```

**Additional Features:**
- Progress slider (0-100%)
- Status indicator (Not Started, In Progress, Complete)
- Delete button with confirmation
- Pre-populated form data

### Action Components

#### AddTaskButton
Floating Action Button (FAB) for creating tasks.

```tsx
import { AddTaskButton } from "@/components/schedule/add-task-button";

<AddTaskButton
  projectId={projectId}
  scheduleId={scheduleId}
  onTaskCreated={(task) => {
    // Add task to list
  }}
/>
```

**Variants:**
- `AddTaskButton`: Fixed FAB in bottom-right
- `AddTaskButtonWithTooltip`: FAB with hover tooltip
- `AddTaskInlineButton`: Inline button for toolbars

**Features:**
- BuildLight Green (#6BF178) background
- Plus icon
- Pulse animation on hover
- Opens CreateTaskModal

#### TaskQuickActions
Three-dot menu with Edit, Duplicate, Delete actions.

```tsx
import { TaskQuickActions } from "@/components/schedule/task-quick-actions";

<TaskQuickActions
  projectId={projectId}
  scheduleId={scheduleId}
  task={task}
  onTaskUpdated={(updatedTask) => {}}
  onTaskDeleted={(taskId) => {}}
  onTaskDuplicated={(newTask) => {}}
/>
```

**Variants:**
- `TaskQuickActions`: Full dropdown menu
- `TaskQuickActionsCompact`: Icon buttons (Edit + Delete only)

**Features:**
- Dropdown menu with Edit, Duplicate, Delete
- Opens EditTaskModal for editing
- Duplicate creates copy with " (Copy)" suffix
- Delete with confirmation dialog

### Display Components

#### TaskProgressIndicator
Visual progress bar with color coding.

```tsx
import {
  TaskProgressIndicator,
  TaskProgressBadge,
  TaskProgressSlider,
  TaskProgressCircle,
  TaskStatusDot,
} from "@/components/schedule/task-progress-indicator";

// Progress bar
<TaskProgressIndicator
  progress={75}
  showPercentage
  showLabel
  size="md"
/>

// Compact badge
<TaskProgressBadge progress={75} />

// Interactive slider
<TaskProgressSlider
  progress={75}
  onChange={(newProgress) => {
    // Auto-save progress
  }}
/>

// Circular indicator
<TaskProgressCircle progress={75} size={40} />

// Status dot
<TaskStatusDot progress={75} size="md" />
```

**Color Coding:**
- 0% = Grey (Not Started)
- 1-99% = BuildLight Green (#6BF178) (In Progress)
- 100% = Dark Green (#059669) (Complete)

#### TaskFilterToolbar
Comprehensive filtering toolbar.

```tsx
import { TaskFilterToolbar } from "@/components/schedule/task-filter-toolbar";

<TaskFilterToolbar
  projectId={projectId}
  filters={filters}
  onFiltersChange={setFilters}
/>
```

**Features:**
- Filter by: Phase, Tags, Assignee, Status
- OR logic within each category
- Active filter chips with X to remove
- Clear all button
- Expandable filter panel
- State persists when switching views

#### TaskListControls
Bulk selection, actions, and sorting.

```tsx
import {
  TaskListControls,
  TaskSortHeader,
  TaskBulkSelectCheckbox,
  TaskBulkSelectAllCheckbox,
  sortTasks,
} from "@/components/schedule/task-list-controls";

// Bulk action toolbar (shows when tasks selected)
<TaskListControls
  tasks={tasks}
  selectedTaskIds={selectedTaskIds}
  onSelectAll={() => {}}
  onDeselectAll={() => {}}
  onBulkDelete={() => {}}
  onBulkColorChange={(color) => {}}
  onBulkPhaseChange={(phase) => {}}
  onBulkTagAdd={(tag) => {}}
  sort={sort}
  onSortChange={setSort}
/>

// Sort header (in table)
<TaskSortHeader
  field="name"
  label="Task Name"
  currentSort={sort}
  onSort={setSort}
/>

// Individual checkbox
<TaskBulkSelectCheckbox
  taskId={task.id}
  isSelected={selectedTaskIds.includes(task.id)}
  onToggle={(taskId) => {}}
/>

// Select all checkbox
<TaskBulkSelectAllCheckbox
  totalTasks={tasks.length}
  selectedCount={selectedTaskIds.length}
  onSelectAll={() => {}}
  onDeselectAll={() => {}}
/>

// Sort tasks utility
const sortedTasks = sortTasks(tasks, sort);
```

**Sort Fields:**
- name, startDate, endDate, phase, progress, duration

**Bulk Actions:**
- Change color
- Change phase
- Add tags
- Delete (with confirmation)

### Integration Example

#### TaskListView
Complete working example with all components.

```tsx
import { TaskListView } from "@/components/schedule/task-list-view";

<TaskListView
  projectId={projectId}
  scheduleId={scheduleId}
/>
```

**Includes:**
- Task filtering toolbar
- Sortable table with all columns
- Bulk selection checkboxes
- Quick progress updates
- Task quick actions
- Add task FAB
- Bulk action toolbar (when tasks selected)

## API Integration

All components integrate with the BuildLight API:

### Endpoints Used

**Tasks:**
- `GET /api/projects/[id]/schedules/[scheduleId]/tasks` - List tasks
- `POST /api/projects/[id]/schedules/[scheduleId]/tasks` - Create task
- `PATCH /api/projects/[id]/schedules/[scheduleId]/tasks/[taskId]` - Update task
- `DELETE /api/projects/[id]/schedules/[scheduleId]/tasks/[taskId]` - Delete task
- `POST /api/projects/[id]/schedules/[scheduleId]/tasks/bulk` - Bulk update

**Project Members:**
- `GET /api/projects/[id]/members` - Get team members

## Type Definitions

All TypeScript interfaces are in `lib/task-types.ts`:

```typescript
import {
  CreateTaskFormData,
  EditTaskFormData,
  TaskDependency,
  TaskFilters,
  TaskSort,
  BulkUpdateData,
} from "@/lib/task-types";
```

## Validation

### Client-side Validation
- Task name: required, max 200 characters
- Dates: start date required, end date must be after start
- Phase: required
- Tags: max 10
- Assignees: max 10
- Dependencies: max 3 (in TaskDependencySelector), max 20 (API)
- Circular dependencies: detected with DFS algorithm

### Server-side Validation
All API endpoints use Zod schemas for validation. Validation errors are returned with `400` status and displayed in the UI.

## Workday Calculations

The DateRangePicker and duration calculations exclude:
- Weekends (Saturday, Sunday)
- US federal holidays (2025-2026)

Functions available in `lib/task-utils.ts`:
- `calculateWorkdays(startDate, endDate)` - Count workdays between dates
- `addWorkdays(startDate, days)` - Add workdays to a date

## Role-Based Access Control

Task editing is disabled for:
- CLIENT role
- SUBCONTRACTOR role

Required roles:
- PROJECT_MANAGER+ for create/update tasks
- OWNER for delete tasks (in API)

Implement in your page:

```tsx
import { hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";

const canEdit = await hasRole(Role.PROJECT_MANAGER);

<EditTaskModal
  {...props}
  // Disable editing based on role
/>
```

## Styling

All components use:
- BuildLight brand colors: #121212 (Graphite Black), #6BF178 (BuildLight Green)
- Tailwind CSS
- Dark mode support
- Swiss minimal design aesthetic

## Optimistic Updates

For better UX, update UI immediately and sync in background:

```tsx
const handleProgressChange = async (taskId, progress) => {
  // 1. Update UI immediately
  setTasks(prev => prev.map(task =>
    task.id === taskId ? { ...task, completed: progress === 100 } : task
  ));

  // 2. Sync with server
  try {
    await fetch(`/api/.../tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: progress === 100 }),
    });
  } catch (error) {
    // 3. Revert on error
    console.error('Failed to update:', error);
    alert('Failed to save progress');
    // Revert UI state
  }
};
```

## Error Handling

All components show clear error messages:
- Validation errors below fields
- API errors in red alert boxes
- Circular dependency paths displayed
- Failed requests with retry options

## Testing

Test all components:

```bash
# Manual testing checklist:
- [ ] Create task with all fields
- [ ] Edit task and update fields
- [ ] Delete task with confirmation
- [ ] Duplicate task
- [ ] Filter by phase, tags, assignee, status
- [ ] Sort by all columns (asc/desc)
- [ ] Bulk select and change color
- [ ] Bulk delete multiple tasks
- [ ] Add dependencies (verify no circular)
- [ ] Test circular dependency detection
- [ ] Quick progress update
- [ ] Test on mobile/tablet
- [ ] Test dark mode
- [ ] Test with different roles
```

## Performance

For large task lists (100+ tasks):
- Use React.memo for task rows
- Virtualize list with react-window
- Debounce filter/sort operations
- Implement pagination or infinite scroll

Example:

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tasks.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {/* Task row */}
    </div>
  )}
</FixedSizeList>
```

## Next Steps

1. **Gantt View Integration**
   - Use DHTMLX Gantt with `lib/dhtmlx-gantt.ts`
   - Enable inline editing in Gantt view
   - Sync changes bidirectionally

2. **Calendar View**
   - Build calendar view component
   - Show tasks on timeline
   - Drag-and-drop to reschedule

3. **Real-time Collaboration**
   - Add WebSocket support
   - Show live updates from other users
   - Optimistic concurrency control

4. **Advanced Features**
   - Task templates
   - Recurring tasks
   - Task checklists
   - File attachments
   - Comments/activity log

## Support

For questions or issues:
- Review API documentation at `/app/api/projects/[id]/schedules/[scheduleId]/tasks/route.ts`
- Check Prisma schema at `/prisma/schema.prisma`
- See task utilities at `/lib/task-utils.ts`
- Review validation schemas at `/lib/validation/schemas.ts`

## License

BuildLight © 2025
