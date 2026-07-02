import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { RMDB } from '../app/services/db';
import 'fake-indexeddb/auto';

/**
 * Creates a new in-memory Dexie database instance for testing.
 * This ensures each test has a clean, isolated database.
 */
export function createTestDb(): RMDB {
    // Using a unique name for each in-memory instance to avoid collisions
    const testDb = new RMDB();
    // @ts-expect-error — accessing internal Dexie property for in-memory mode
    testDb.name = `test_db_${Math.random().toString(36).substring(7)}`;
    return testDb;
}

interface RenderOptions {
    db?: RMDB;
}

/**
 * A custom render function that wraps components with all necessary providers.
 * 
 * @param ui The React component to render.
 * @param options Configuration options (e.g., passing a specific test database).
 */
export function renderWithProviders(ui: React.ReactNode, { db: _db, ...otherOptions }: RenderOptions = {}) {
    return render(
        <MantineProvider theme={{
            components: {
                Modal: {
                    defaultProps: {
                        transitionProps: { duration: 0 },
                        trapFocus: false,
                        lockScroll: false,
                        withinPortal: false 
                    }
                }
            }
        }}>
            <ModalsProvider>
                {ui}
            </ModalsProvider>
        </MantineProvider>,
        otherOptions
    );
}
