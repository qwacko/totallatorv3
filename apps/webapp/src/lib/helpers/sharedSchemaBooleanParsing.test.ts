import { describe, expect, it } from 'vitest';

import { createAccountSchema, updateJournalSchema } from '@totallator/shared';

describe('shared schema boolean parsing', () => {
	it('parses FALSE account import values as false', () => {
		const result = createAccountSchema.parse({
			title: 'Test Account',
			accountGroupCombined: '',
			type: 'expense',
			status: 'active',
			isCash: 'FALSE',
			isNetWorth: 'FALSE',
			isCatchall: 'FALSE'
		});

		expect(result.isCash).toBe(false);
		expect(result.isNetWorth).toBe(false);
		expect(result.isCatchall).toBe(false);
	});

	it('parses common truthy account values as true', () => {
		const result = createAccountSchema.parse({
			title: 'Test Account',
			accountGroupCombined: '',
			type: 'expense',
			status: 'active',
			isCash: 'yes',
			isNetWorth: '1',
			isCatchall: 'ON'
		});

		expect(result.isCash).toBe(true);
		expect(result.isNetWorth).toBe(true);
		expect(result.isCatchall).toBe(true);
	});

	it('parses FALSE journal update values as false', () => {
		const result = updateJournalSchema.parse({
			setReconciled: 'FALSE',
			clearReconciled: 'FALSE',
			setDataChecked: 'FALSE',
			clearDataChecked: 'FALSE',
			setComplete: 'FALSE',
			clearComplete: 'FALSE',
			setLinked: 'FALSE',
			clearLinked: 'FALSE'
		});

		expect(result.setReconciled).toBe(false);
		expect(result.clearReconciled).toBe(false);
		expect(result.setDataChecked).toBe(false);
		expect(result.clearDataChecked).toBe(false);
		expect(result.setComplete).toBe(false);
		expect(result.clearComplete).toBe(false);
		expect(result.setLinked).toBe(false);
		expect(result.clearLinked).toBe(false);
	});

	it('treats blank journal update boolean CSV cells as unset and applies defaults', () => {
		const result = updateJournalSchema.parse({
			setLinked: 'true',
			clearLinked: '',
			setComplete: '',
			clearComplete: ''
		});

		expect(result.setLinked).toBe(true);
		expect(result.clearLinked).toBe(false);
		expect(result.setComplete).toBe(false);
		expect(result.clearComplete).toBe(false);
	});

	it('parses comma-separated journal update label fields from CSV', () => {
		const result = updateJournalSchema.parse({
			labelTitles: 'Bills, Important',
			addLabelTitles: 'Travel, Work',
			removeLabels: 'label-1, label-2'
		});

		expect(result.labelTitles).toEqual(['Bills', 'Important']);
		expect(result.addLabelTitles).toEqual(['Travel', 'Work']);
		expect(result.removeLabels).toEqual(['label-1', 'label-2']);
	});
});
