import { describe, expect, it } from 'vitest';

import { cronJobDefinitions } from './cronJobDefinitions';

describe('cronJobDefinitions', () => {
	it('tracks the automatic filter sweeper as a long-running process', () => {
		const definition = cronJobDefinitions.find((item) => item.id === 'automatic-filters');

		expect(definition).toMatchObject({
			name: 'Apply Automatic Filters',
			schedule: '*/15 * * * *',
			longProcess: {
				type: 'automatic-filters-sweeper',
				message: 'Automatic filters sweeper'
			}
		});
	});

	it('tracks the import sweeper as a long-running process', () => {
		const definition = cronJobDefinitions.find((item) => item.id === 'automatic-import-processing');

		expect(definition).toMatchObject({
			name: 'Automatic Import Processing',
			schedule: '*/15 * * * *',
			longProcess: {
				type: 'import-sweeper',
				message: 'Import sweeper'
			}
		});
	});
});
