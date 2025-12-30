### WCAG 2.1 AA Checklist

#### 1. Perceivable (See/Hear)
*   [ ] **1.3.1 Info and Relationships:**
    *   Ensure semantic HTML is used (`<main>`, `<nav>`, `<h1>`–`<h6>`).
    *   Ensure tables (`<Table>`) have headers (`<th>`) and scope attributes where applicable.
    *   Form inputs must have associated `<label>` elements (Mantine handles this if `label` prop is used).
*   [ ] **1.4.3 Contrast (Minimum):**
    *   Text vs Background must be at least **4.5:1** for normal text.
    *   *Check:* Your Teal/Orange badges and "Dimmed" text.
*   [ ] **1.4.11 Non-text Contrast:**
    *   UI components (input borders, progress bars) must have **3:1** contrast against adjacent colors.
    *   *Check:* The "Supply/Demand" bars against the table background.

#### 2. Operable (Keyboard/Nav)
*   [ ] **2.1.1 Keyboard:**
    *   All interactive elements (Buttons, Inputs, Dropdowns) must be reachable via `Tab`.
    *   All elements must be usable with `Enter` or `Space`.
    *   No "Keyboard Traps" (you can tab in *and* out of the modal).
*   [ ] **2.4.3 Focus Order:**
    *   Tabbing sequence matches the visual layout (Top-Left -> Bottom-Right).
    *   When a Modal opens, focus moves *into* the modal. When it closes, focus returns to the button that opened it.
*   [ ] **2.4.6 Headings and Labels:**
    *   Headings describe the topic or purpose.
    *   Labels describe the purpose of the input (e.g., "City Name" instead of just "Name").
*   [ ] **2.4.7 Focus Visible:**
    *   The keyboard focus indicator (blue ring) must be visible on all focused elements.

#### 3. Understandable (Predictable)
*   [ ] **3.3.1 Error Identification:**
    *   If an input error is detected, the item is identified and the error is described to the user in text (e.g., Notification Toast).
*   [ ] **3.3.2 Labels or Instructions:**
    *   Content requires user input (e.g. "Create World") has labels or instructions.

#### 4. Robust (Code Quality)
*   [ ] **4.1.2 Name, Role, Value:**
    *   For all custom components (like your Sector Row actions), the name and role can be programmatically determined.
    *   *Action:* Add `aria-label` to icon-only buttons (like the "+" or "Trash" icons).