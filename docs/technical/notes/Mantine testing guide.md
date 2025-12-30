# Testing Guide: React + Mantine + Vitest

Testing UI components built with Mantine requires three key things:
1.  **Mocking Browser APIs** (that JSDOM lacks).
2.  **Wrapping Components** in the Theme Provider.
3.  **Using Accessibility-first Selectors**.

## 1. Global Setup (`src/tests/setup.ts`)
Mantine relies on `matchMedia` and `ResizeObserver` for responsiveness. These do not exist in the test environment (JSDOM), so we must mock them globally.

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia (for color scheme & media queries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (for layout) - MUST be a class
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

## 2. The Render Wrapper
You cannot render a Mantine component (like `<Button>`) without a `<MantineProvider>` ancestor. It will crash.

Create a helper function in your test file (or a shared utility):

```tsx
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

export const renderWithMantine = (ui: React.ReactNode) => {
    return render(
        <MantineProvider>
            {ui}
        </MantineProvider>
    );
};
```

**Usage in tests:**
```tsx
it('renders correctly', () => {
    renderWithMantine(<MyComponent />); // Works!
    // render(<MyComponent />); // CRASHES!
});
```

## 3. Finding Elements
Mantine components often render complex HTML structures (e.g., a `<Select>` renders an input, a label, and a dropdown portal).

**Do NOT use:**
*   `container.querySelector('.mantine-Button-root')` (Class names change).
*   `getByText` on inputs (Text might be in a label or placeholder).

**DO use (Accessibility Selectors):**
*   **Buttons:** `screen.getByRole('button', { name: /save/i })`
*   **Inputs:** `screen.getByRole('textbox', { name: /city name/i })` (Requires `aria-label` or `<label>`).
*   **Dropdowns:** `screen.getByRole('combobox', { name: /select world/i })`.

## 4. User Interactions
Use `@testing-library/user-event` for interactions. It handles focus and typing better than `fireEvent`.

```tsx
import userEvent from '@testing-library/user-event';

it('submits form', async () => {
    const user = userEvent.setup();
    renderWithMantine(<MyForm />);
    
    // Type in input
    const input = screen.getByRole('textbox', { name: /name/i });
    await user.type(input, 'New World');
    
    // Click button
    const btn = screen.getByRole('button', { name: /create/i });
    await user.click(btn);
});
```

## 5. Common Gotchas
*   **Modals:** Mantine Modals render in a **Portal** (outside the root div). `screen.getByText` works fine, but `container.querySelector` will fail.
*   **Act Warning:** If your component fetches data on mount (`useEffect`), you must `await screen.findByText(...)` to wait for the data before the test ends.
*   **Hoisting:** If you mock modules (`vi.mock`), use `vi.hoisted` for variables you want to use inside the mock factory.