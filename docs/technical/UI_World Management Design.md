# UI: World Management Design

## Overview

World management UI allows users to create, select, delete worlds, and import/export them as JSON files for backup and sharing.

## UI Elements and Layout

### World Selection Section

**Location:** Top of main page, always visible

**Elements:**

- **Dropdown:** "Select world" with list of existing worlds (sorted by creation date, newest first)
- **Text input:** "World name" for new world creation
- **"Create World" button:** Creates new world and auto-selects it
- **"Delete World" button:** Appears only when world is selected
- **"Export World" button:** Appears only when world is selected
- **"Import World" file input:** Always available

## User Flows

### Create World Flow

1. User types world name in text input
2. Clicks "Create World"
3. World appears in dropdown and gets auto-selected
4. Cities section appears (initially empty)
5. Text input resets to placeholder text

### Select World Flow

1. User opens dropdown
2. Selects existing world
3. Cities section updates to show cities in selected world
4. If world has cities, first city gets auto-selected
5. Export/Delete buttons become available

### Delete World Flow

1. User clicks "Delete World" (only available when world selected)
2. **Confirmation dialog:** "Delete world '[WorldName]'? This will remove all cities and sectors. This cannot be undone."
3. User confirms → World deleted, dropdown resets to "Select world", cities/sectors cleared
4. User cancels → No change

### Export World Flow

1. User clicks "Export World" (only available when world selected)
2. Browser downloads JSON file: `[WorldName].rmworld.json`
3. **Success feedback:** Brief "World exported successfully" message
4. **File contents:** `{ version: 1, world: {...}, cities: [...], sectors: [...] }`

### Import World Flow

1. User clicks "Choose File" for import input
2. Selects `.json` file from computer
3. **Validation:** Check file format, version compatibility
4. **Conflict handling:** If world with same ID exists, show dialog: "World '[Name]' already exists. Replace it?"
5. **Success:** World appears in dropdown, gets auto-selected, success message shown
6. **Error:** Show error message, no changes made

## Edge Cases and Error Handling

### Empty States

- **No worlds exist:** Dropdown shows "No worlds yet", cities/sectors sections hidden
- **Selected world has no cities:** Cities section shows "No cities yet. Add one to get started!"
- **Selected city has no sectors:** Should not happen (cities always created with 10 sectors)

### Validation and Errors

- **Empty world name:** Default to "Untitled World"
- **Import invalid file:** "Invalid world file. Please select a valid .rmworld.json file."
- **Import incompatible version:** "This world file is from a newer version. Please update the app."
- **Import corrupted data:** "World file is corrupted and cannot be imported."

### Confirmation Dialogs (Destructive Actions)

- **Delete World:** Required confirmation with world name shown
- **Import over existing:** Optional confirmation (user choice to replace)
- **Dialog style:** Native `confirm()` for MVP, custom modal for better UX later

## Accessibility and UX

- **Keyboard navigation:** All controls accessible via Tab key
- **Screen readers:** Proper labels and ARIA attributes
- **Loading states:** Show "Importing..." during file processing
- **Clear feedback:** Success/error messages for all operations
- **Undo prevention:** Clear warnings for destructive actions

## Technical Notes

- **File format:** JSON with version field for future migrations
- **File naming:** `[WorldName].rmworld.json` (sanitize special characters)
- **Storage:** Import writes to IndexedDB, export reads from IndexedDB
- **State management:** Use existing React state patterns (useState, useEffect)

## Future Enhancements (Phase 2)

- **Bulk operations:** Export/import multiple worlds
- **World templates:** Save world as template for reuse
- **Cloud sync:** Backup worlds to cloud storage
- **World sharing:** Share world URLs with other users
