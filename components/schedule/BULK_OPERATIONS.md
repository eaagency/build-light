# Bulk Operations & Cross-Project Filtering

Comprehensive bulk editing and cross-project task management for BuildLight.

## Overview

This module provides powerful tools for managing multiple tasks at once and viewing tasks across an entire project portfolio. Built with performance, validation, and user safety in mind.

## Bulk Editing Components

### BulkColorEditor

**Path:** `components/schedule/bulk-color-editor.tsx`

Modal for changing color of multiple tasks simultaneously.

**Features:**
- Phase color presets (14 construction phases)
- Custom color picker with hex input
- Live preview of selected color
- Shows task count being edited
- Optimistic updates

**Usage:**
```tsx
import { BulkColorEditor } from "@/components/schedule/bulk-color-editor";

<BulkColorEditor
  projectId={projectId}
  scheduleId={scheduleId}
  selectedTasks={selectedTasks}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={(updatedTasks) => {
    // Refresh task list
    refreshTasks();
  }}
/>
```

**API Integration:**
```
POST /api/projects/[id]/schedules/[scheduleId]/tasks/bulk
Body: { taskIds: string[], updates: { color: string }, operation: "update" }
```

---

### BulkPhaseAssignment

**Path:** `components/schedule/bulk-phase-assignment.tsx`

Modal for changing phase of multiple tasks with validation.

**Features:**
- Shows current phases with task counts
- Phase dropdown with all 14 construction phases
- **Warning system** for incompatible phase jumps:
  - Jumping backward > 2 phases
  - Jumping forward > 3 phases
- Auto-updates colors if `autoColorByPhase` enabled
- Lists all selected tasks with their current phases

**Usage:**
```tsx
import { BulkPhaseAssignment } from "@/components/schedule/bulk-phase-assignment";

<BulkPhaseAssignment
  projectId={projectId}
  scheduleId={scheduleId}
  selectedTasks={selectedTasks}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={(updatedTasks) => {
    refreshTasks();
  }}
  autoColorByPhase={true}
/>
```

**Validation Rules:**
- ⚠️ Warns if moving tasks backward in construction sequence
- ⚠️ Warns if skipping multiple phases
- Allows override after warning (not blocking)

---

### BulkTagEditor

**Path:** `components/schedule/bulk-tag-editor.tsx`

Modal for adding or replacing tags on multiple tasks.

**Features:**
- **Two modes:**
  - **Add Tags:** Keeps existing tags, adds new ones
  - **Replace Tags:** Removes all existing, sets new ones
- Common tag suggestions (Invoice-Driver, Designer, etc.)
- Custom tag input with Enter key support
- Shows current tags across selected tasks
- Max 10 tags per task enforcement
- Duplicate tag prevention

**Usage:**
```tsx
import { BulkTagEditor } from "@/components/schedule/bulk-tag-editor";

<BulkTagEditor
  projectId={projectId}
  scheduleId={scheduleId}
  selectedTasks={selectedTasks}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={(updatedTasks) => {
    refreshTasks();
  }}
/>
```

**Edge Cases Handled:**
- Tasks with no existing tags
- Duplicate tags
- Exceeding max tag limit (10)
- Empty tag strings

---

### BulkDeleteConfirmation

**Path:** `components/schedule/bulk-delete-confirmation.tsx`

Confirmation modal for deleting multiple tasks with safety measures.

**Features:**
- Lists all tasks to be deleted with project names
- "This cannot be undone" warning
- **Requires typing "DELETE"** if > 10 tasks
- Destructive styling (red theme)
- Shows task count and details
- Soft delete (sets `deletedAt` timestamp)

**Usage:**
```tsx
import { BulkDeleteConfirmation } from "@/components/schedule/bulk-delete-confirmation";

<BulkDeleteConfirmation
  projectId={projectId}
  scheduleId={scheduleId}
  selectedTasks={selectedTasks}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
    // Clear selection and refresh
    setSelectedTasks([]);
    refreshTasks();
  }}
/>
```

**Safety Measures:**
1. Clear warning message
2. List of all tasks to be deleted
3. Typing confirmation for large deletions (> 10 tasks)
4. Prominent Cancel button
5. Soft delete (can be recovered)

---

### AutoColorByPhase

**Path:** `components/schedule/auto-color-by-phase.tsx`

Toggle for controlling automatic task coloring behavior.

**When Enabled (default):**
- Tasks automatically use their phase color
- Changing task phase → auto-updates color
- Manual color selection disabled (greyed out)

**When Disabled:**
- Users can set custom colors per task
- Phase changes don't affect color
- Full color control

**Usage:**
```tsx
import { AutoColorByPhase } from "@/components/schedule/auto-color-by-phase";

<AutoColorByPhase
  organizationId={organizationId}
  isEnabled={autoColorEnabled}
  onToggle={(enabled) => {
    setAutoColorEnabled(enabled);
    // Update organization preferences
  }}
/>
```

**Persistence:**
- Saved to organization settings
- Applies to all projects in organization
- PATCH to `/api/organizations/[orgId]/settings`

---

## API Endpoints

### Bulk Update Endpoint

**Path:** `POST /api/projects/[id]/schedules/[scheduleId]/tasks/bulk`

**Request Body:**
```typescript
{
  taskIds: string[];           // Array of task IDs to update
  updates?: {                  // Updates to apply (for 'update' operation)
    color?: string;
    phase?: TaskPhase;
    tags?: string[];
    assigneeIds?: string[];
  };
  operation: 'update' | 'delete' | 'duplicate' | 'add-tags' | 'replace-tags';
}
```

**Response:**
```typescript
{
  updatedCount: number;
  tasks: Task[];
}
```

**Operations:**
- `update`: Apply updates to all tasks
- `delete`: Soft delete all tasks (set deletedAt)
- `duplicate`: Create copies of tasks
- `add-tags`: Add tags without removing existing
- `replace-tags`: Replace all tags with new ones

**Limits:**
- Max 100 tasks per operation (prevent timeout)
- Rate limit: STANDARD (20 requests per 10 seconds)

**Validation:**
- Task IDs must belong to specified schedule
- User must have PROJECT_MANAGER+ role
- OWNER role required for delete operation

---

## Integration with Existing Components

### TaskListControls Integration

Bulk operations work seamlessly with existing `TaskListControls`:

```tsx
import { TaskListControls } from "@/components/schedule/task-list-controls";
import { BulkColorEditor } from "@/components/schedule/bulk-color-editor";
import { BulkPhaseAssignment } from "@/components/schedule/bulk-phase-assignment";
import { BulkTagEditor } from "@/components/schedule/bulk-tag-editor";
import { BulkDeleteConfirmation } from "@/components/schedule/bulk-delete-confirmation";

export function TaskList() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [showPhaseEditor, setShowPhaseEditor] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));

  return (
    <>
      {/* Bulk action toolbar (appears when tasks selected) */}
      <TaskListControls
        tasks={tasks}
        selectedTaskIds={selectedTaskIds}
        onSelectAll={() => setSelectedTaskIds(tasks.map(t => t.id))}
        onDeselectAll={() => setSelectedTaskIds([])}
        onBulkDelete={() => setShowDeleteConfirm(true)}
        onBulkColorChange={() => setShowColorEditor(true)}
        onBulkPhaseChange={() => setShowPhaseEditor(true)}
        onBulkTagAdd={() => setShowTagEditor(true)}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Modals */}
      <BulkColorEditor
        projectId={projectId}
        scheduleId={scheduleId}
        selectedTasks={selectedTasks}
        isOpen={showColorEditor}
        onClose={() => setShowColorEditor(false)}
        onSuccess={refreshTasks}
      />

      <BulkPhaseAssignment
        projectId={projectId}
        scheduleId={scheduleId}
        selectedTasks={selectedTasks}
        isOpen={showPhaseEditor}
        onClose={() => setShowPhaseEditor(false)}
        onSuccess={refreshTasks}
        autoColorByPhase={autoColorByPhase}
      />

      <BulkTagEditor
        projectId={projectId}
        scheduleId={scheduleId}
        selectedTasks={selectedTasks}
        isOpen={showTagEditor}
        onClose={() => setShowTagEditor(false)}
        onSuccess={refreshTasks}
      />

      <BulkDeleteConfirmation
        projectId={projectId}
        scheduleId={scheduleId}
        selectedTasks={selectedTasks}
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onSuccess={() => {
          setSelectedTaskIds([]);
          refreshTasks();
        }}
      />
    </>
  );
}
```

---

## Performance Considerations

**Optimistic Updates:**
All bulk operations use optimistic updates for better UX:
1. Update UI immediately
2. Show loading state
3. Sync with server
4. Revert on error with toast notification

**Batch Limits:**
- Max 100 tasks per bulk operation
- Larger batches should be split
- Show progress indicator for > 50 tasks

**API Efficiency:**
- Single API call for multiple updates
- Bulk operations run in transaction
- Returns only updated tasks (not entire list)

---

## User Experience

**Visual Feedback:**
- Loading spinners during operations
- Toast notifications on success/error
- Optimistic updates (instant UI changes)
- Progress bars for long operations

**Validation:**
- Client-side validation before API call
- Server-side validation with clear error messages
- Warning dialogs for destructive actions
- Confirmation for unusual operations

**Error Handling:**
- Clear error messages
- Automatic retry for network errors
- Rollback on failure
- User-friendly error descriptions

---

## Keyboard Shortcuts (Future Enhancement)

Suggested shortcuts for power users:
- `Ctrl/Cmd + A` - Select all tasks
- `Ctrl/Cmd + D` - Deselect all
- `Ctrl/Cmd + C` - Copy selected tasks
- `Ctrl/Cmd + V` - Paste tasks
- `Delete` - Delete selected tasks (with confirmation)
- `Ctrl/Cmd + Shift + C` - Change color
- `Ctrl/Cmd + Shift + P` - Change phase
- `Ctrl/Cmd + Shift + T` - Edit tags

---

## Testing

**Manual Test Cases:**

1. **Bulk Color Change:**
   - Select 10 tasks
   - Change color to Framing phase color (#059669)
   - Verify all tasks updated
   - Check optimistic update worked

2. **Bulk Phase Change:**
   - Select tasks in Foundation phase
   - Change to Framing phase
   - Verify warning shown (if applicable)
   - Check colors auto-updated (if autoColorByPhase enabled)

3. **Bulk Tag Add:**
   - Select 5 tasks
   - Add "Invoice-Driver" tag
   - Verify tag added to all tasks
   - Existing tags preserved

4. **Bulk Tag Replace:**
   - Select tasks with various tags
   - Replace with "Inspection" tag only
   - Verify all old tags removed
   - Only new tag present

5. **Bulk Delete:**
   - Select 3 tasks
   - Click delete
   - Verify no typing required
   - Confirm deletion
   - Tasks removed

6. **Large Bulk Delete:**
   - Select 15 tasks
   - Click delete
   - Verify typing "DELETE" required
   - Type "DELETE"
   - Confirm deletion

7. **AutoColorByPhase Toggle:**
   - Enable auto-color
   - Change task phase
   - Verify color auto-updated
   - Disable auto-color
   - Change task phase
   - Verify color unchanged

8. **Error Handling:**
   - Disconnect network
   - Try bulk operation
   - Verify error message shown
   - Reconnect
   - Retry operation

---

## Future Enhancements

**Task Duplication:**
- Duplicate to same project
- Duplicate to different project
- Adjust dates by offset
- Keep/remove dependencies option

**Bulk Date Adjustment:**
- Move all tasks forward/backward by X days
- Respect dependencies
- Update dependent tasks

**Cross-Project Bulk Operations:**
- Bulk operations across multiple projects
- Portfolio-level task management
- Saved bulk operation templates

**Advanced Validation:**
- Resource conflict detection
- Workday calculations
- Critical path impact warnings
- Budget constraint checks

---

## BuildLight Design Notes

**Color Palette:**
- Primary action: #6BF178 (BuildLight Green)
- Destructive: #EF4444 (Red)
- Warning: #F59E0B (Amber)
- Background: #121212 (Graphite Black)

**Animations:**
- Modal entrance: 200ms ease-out
- Button hover: 150ms
- Loading spinner: 1s linear infinite
- Toast fade in/out: 300ms

**Accessibility:**
- All modals keyboard navigable
- Focus trap in modals
- Screen reader announcements
- Clear focus indicators
- Sufficient color contrast (WCAG AA)

---

## Support

For questions or issues with bulk operations:
- Review API documentation at `/app/api/projects/[id]/schedules/[scheduleId]/tasks/bulk/route.ts`
- Check task utilities at `/lib/task-utils.ts`
- See task types at `/lib/task-types.ts`

## License

BuildLight © 2025
