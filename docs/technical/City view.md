The City Management module serves as the primary entry point for World interaction, allowing users to create, select, and manage cities within a specific World context.

#### Functional Requirements

* **List View:** Displays all cities associated with the currently selected World.
* **Selection:** Clicking a city selects it as the active context for further operations (e.g., Sector management).
* **Creation:** Users can add new cities via a prompt.
* **Deletion:** Users can remove cities. This action is destructive and requires confirmation.
* **Feedback:** The UI provides immediate visual feedback for success and error states.

#### UI Flow & Behaviors

| State | Behavior | Visual Indicator |
| :--- | :--- | :--- |
| **Empty State** | When no cities exist in the world. | Displays "No cities yet. Add one to get started!" message. |
| **Selection** | User clicks a city button. | The button gains the `.selected` class (visual highlight). The "Remove City" button appears. |
| **Add City** | User clicks "Add City". | A browser prompt requests the name. On confirm: City is created and auto-selected. On cancel: No action. |
| **Delete Request** | User clicks "Remove City". | A `ConfirmationDialog` modal appears warning that all sectors will be lost. |
| **Delete Confirm** | User clicks "Delete" in modal. | City is removed, selection is cleared, and a success toast message appears. |

####  Confirmation Logic

To prevent accidental data loss, the delete workflow is strictly gated:

1. **Pre-condition:** A city must be selected.
2. **Trigger:** "Remove City" button is clicked.
3. **Gate:** A modal renders with `confirmLabel="Delete"` and `cancelLabel="Cancel"`.
4. **Action:** The actual API call to `removeCity` only occurs if the "Delete" button within the modal is clicked.

#### Component Structure

* `CityManager`: Main container handling state (`selectedCity`, `showConfirm`) and service calls.
* `ConfirmationDialog`: Reusable modal component for the delete flow.
* `MessageDisplay`: Scoped notification area (scope: `'city'`) for success/error feedback.

#### Testing Strategy

* **Service Mocks:** `worldService` is mocked to prevent network calls during testing.
* **Interaction:** `userEvent` is used to simulate clicks and prompt inputs.
* **Validation:** Tests verify that the "Remove City" button is hidden when no city is selected and that the confirmation dialog appears/disappears correctly.
