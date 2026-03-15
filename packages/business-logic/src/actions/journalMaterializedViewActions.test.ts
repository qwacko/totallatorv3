import Papa from 'papaparse';
import { describe, expect, it, vi } from 'vitest';

import { journalMaterializedViewActions } from './journalMaterializedViewActions';

describe('journalMaterializedViewActions.generateCSVData', () => {
	it('exports transaction import CSV dates in ISO format', async () => {
		const listSpy = vi.spyOn(journalMaterializedViewActions, 'list').mockResolvedValue({
			data: [
				{
					id: 'journal-1',
					transactionId: 'txn-1',
					date: new Date('2026-03-12T00:00:00.000Z'),
					dateText: '2026-03-12',
					description: 'Coffee',
					amount: -6.5,
					accountTitle: 'Wallet',
					accountTitleCombined: 'Assets:Cash:Wallet',
					otherJournals: [
						{ accountTitle: 'Coffee', accountGroup: 'Expenses:Food' }
					],
					billTitle: null,
					budgetTitle: null,
					categoryTitle: 'Food',
					tagTitle: 'Recurring',
					complete: true,
					dataChecked: false,
					reconciled: true
				}
			]
		} as any);

		const csv = await journalMaterializedViewActions.generateCSVData({
			filter: {},
			returnType: 'import'
		});
		const parsed = Papa.parse<Record<string, string>>(csv, { header: true });

		expect(parsed.errors).toEqual([]);
		expect(parsed.data).toHaveLength(1);
		expect(parsed.data[0]?.date).toBe('2026-03-12');
		expect(parsed.data[0]?.accountTitle).toBe('Assets:Cash:Wallet');
		expect(parsed.data[0]?.otherAccountTitle).toBe('Expenses:Food:Coffee');

		listSpy.mockRestore();
	});

	it('exports journal update CSV in an update-compatible shape', async () => {
		const listSpy = vi.spyOn(journalMaterializedViewActions, 'list').mockResolvedValue({
			data: [
				{
					id: 'journal-1',
					transactionId: 'txn-1',
					date: new Date('2026-03-12T00:00:00.000Z'),
					dateText: '2026-03-12',
					description: 'Coffee',
					amount: -6.5,
					accountTitle: 'Assets:Cash:Wallet',
					otherJournals: [{ id: 'journal-2', accountTitle: 'Expenses:Food:Coffee' }],
					billTitle: null,
					budgetTitle: null,
					categoryTitle: 'Food',
					tagTitle: 'Recurring',
					labels: [{ id: 'label-1', title: 'Cafe', labelToJournalId: 'rel-1' }],
					linked: false,
					complete: false,
					dataChecked: true,
					reconciled: false
				}
			]
		} as any);

		const csv = await journalMaterializedViewActions.generateCSVData({
			filter: {},
			returnType: 'journalUpdate'
		});
		const parsed = Papa.parse<Record<string, string>>(csv, { header: true });

		expect(parsed.errors).toEqual([]);
		expect(parsed.data).toHaveLength(1);
		expect(parsed.data[0]).toMatchObject({
			id: 'journal-1',
			date: '2026-03-12',
			accountTitle: 'Assets:Cash:Wallet',
			otherAccountTitle: 'Expenses:Food:Coffee',
			labelTitles: 'Cafe',
			clearLinked: 'true',
			clearComplete: 'true',
			setDataChecked: 'true',
			clearReconciled: 'true'
		});

		listSpy.mockRestore();
	});

	it('uses stored dateText for journal update export', async () => {
		const listSpy = vi.spyOn(journalMaterializedViewActions, 'list').mockResolvedValue({
			data: [
				{
					id: 'journal-1',
					transactionId: 'txn-1',
					date: new Date('2026-03-11T13:00:00.000Z'),
					dateText: '2026-03-12',
					description: 'Coffee',
					amount: -6.5,
					accountTitle: 'Assets:Cash:Wallet',
					otherJournals: [{ id: 'journal-2', accountTitle: 'Expenses:Food:Coffee' }],
					billTitle: null,
					budgetTitle: null,
					categoryTitle: 'Food',
					tagTitle: 'Recurring',
					labels: [],
					linked: true,
					complete: false,
					dataChecked: false,
					reconciled: false
				}
			]
		} as any);

		const csv = await journalMaterializedViewActions.generateCSVData({
			filter: {},
			returnType: 'journalUpdate'
		});
		const parsed = Papa.parse<Record<string, string>>(csv, { header: true });

		expect(parsed.data[0]?.date).toBe('2026-03-12');

		listSpy.mockRestore();
	});
});
