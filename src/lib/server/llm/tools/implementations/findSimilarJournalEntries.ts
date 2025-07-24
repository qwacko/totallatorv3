import type { Tool, ToolExecutionContext, ToolExecutionResult } from '../types';
import { journalMaterializedViewActions, type RecommendationType } from '../../../db/actions/journalMaterializedViewActions';
import { journalMaterialisedList } from '../../../db/actions/helpers/journal/journalList';
import type { JournalFilterSchemaInputType } from '$lib/schema/journalSchema';

export const findSimilarJournalEntriesTool: Tool = {
	definition: {
		name: 'findSimilarJournalEntries',
		description: 'Find journal entries that are similar to the given criteria. Uses existing matching logic including import data similarity for better results. Can search by journal_id for import-based recommendations or by general criteria.',
		parameters: {
			journal_id: {
				type: 'string',
				description: 'ID of a specific journal entry to find similar entries for (uses import data similarity)'
			},
			description: {
				type: 'string',
				description: 'Description text to search for in journal entries'
			},
			account_id: {
				type: 'string',
				description: 'Account ID to limit search to specific account'
			},
			amount_min: {
				type: 'number',
				description: 'Minimum transaction amount'
			},
			amount_max: {
				type: 'number',
				description: 'Maximum transaction amount'
			},
			date_from: {
				type: 'string',
				description: 'Search from this date (YYYY-MM-DD format)'
			},
			date_to: {
				type: 'string',
				description: 'Search to this date (YYYY-MM-DD format)'
			},
			similarity_threshold: {
				type: 'number',
				description: 'Similarity threshold for import-based matching (0.0-1.0, default: 0.3)'
			},
			limit: {
				type: 'number',
				description: 'Maximum number of results to return (default: 10)'
			},
			data_checked_only: {
				type: 'boolean',
				description: 'Only return entries that have been data checked (default: true)'
			}
		},
		required: []
	},

	async execute(
		parameters: Record<string, any>,
		context: ToolExecutionContext
	): Promise<ToolExecutionResult> {
		try {
			const { 
				journal_id, 
				description, 
				account_id, 
				amount_min, 
				amount_max, 
				date_from, 
				date_to, 
				similarity_threshold = 0.3,
				limit = 10,
				data_checked_only = true
			} = parameters;

			// If journal_id is provided, use the existing recommendation system
			if (journal_id) {
				try {
					// First get the journal entry details
					const journalFilter: JournalFilterSchemaInputType = {
						idArray: [journal_id],
						page: 0,
						pageSize: 1
					};

					const journalResults = await journalMaterialisedList({
						db: context.db,
						filter: journalFilter
					});

					if (journalResults.data.length === 0) {
						return {
							success: false,
							error: `Journal entry with id ${journal_id} not found`
						};
					}

					const targetJournal = journalResults.data[0];

					// Use the existing recommendation system
					const recommendations = await journalMaterializedViewActions.listRecommendations({
						db: context.db,
						journals: [{
							id: targetJournal.id,
							description: targetJournal.description,
							dataChecked: targetJournal.dataChecked,
							accountId: targetJournal.accountId,
							importDetail: targetJournal.importDetail ? { dataToUse: targetJournal.importDetail } : null
						}],
						similarityThreshold: similarity_threshold
					});

					if (!recommendations || recommendations.length === 0) {
						return {
							success: true,
							data: {
								message: 'No similar journal entries found using import data similarity',
								method: 'import_similarity',
								target_journal: {
									id: targetJournal.id,
									description: targetJournal.description,
									account: targetJournal.accountTitle,
									data_checked: targetJournal.dataChecked
								},
								recommendations: []
							}
						};
					}

					return {
						success: true,
						data: {
							message: `Found ${recommendations.length} similar journal entries using import data similarity`,
							method: 'import_similarity',
							target_journal: {
								id: targetJournal.id,
								description: targetJournal.description,
								account: targetJournal.accountTitle,
								data_checked: targetJournal.dataChecked
							},
							recommendations: recommendations.slice(0, limit).map((rec: RecommendationType) => ({
								id: rec.journalId,
								date: rec.journalDate.toISOString().split('T')[0],
								amount: Number(rec.journalAmount),
								description: rec.journalDescription,
								account_id: rec.journalAccountId,
								payee_account_id: rec.payeeAccountId,
								similarity_score: rec.checkSimilarity,
								matched_description: rec.checkDescription,
								search_description: rec.searchDescription,
								category_id: rec.journalCategoryId,
								tag_id: rec.journalTagId,
								bill_id: rec.journalBillId,
								budget_id: rec.journalBudgetId,
								data_checked: rec.journalDataChecked
							}))
						}
					};

				} catch (error) {
					return {
						success: false,
						error: `Failed to get recommendations for journal ${journal_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
					};
				}
			}

			// Otherwise use general search criteria with the journal list functionality
			const filter: JournalFilterSchemaInputType = {
				page: 0,
				pageSize: Math.min(limit, 50),
				...(description && { textFilter: description }),
				...(account_id && { accountIdArray: [account_id] }),
				...(amount_min !== undefined && { amountMin: amount_min }),
				...(amount_max !== undefined && { amountMax: amount_max }),
				...(date_from && { dateAfter: date_from }),
				...(date_to && { dateBefore: date_to }),
				...(data_checked_only && { dataCheckedArray: [true] })
			};

			const results = await journalMaterialisedList({
				db: context.db,
				filter
			});

			return {
				success: true,
				data: {
					message: `Found ${results.data.length} journal entries matching criteria`,
					method: 'general_search',
					search_criteria: {
						description,
						account_id,
						amount_min,
						amount_max,
						date_from,
						date_to,
						data_checked_only
					},
					total_count: results.count,
					page_count: results.pageCount,
					entries: results.data.map(entry => ({
						id: entry.id,
						transaction_id: entry.transactionId,
						date: entry.date?.toISOString().split('T')[0] || null,
						amount: Number(entry.amount),
						description: entry.description,
						payee: entry.payee,
						note: entry.note,
						account_id: entry.accountId,
						account_title: entry.accountTitle,
						category_id: entry.categoryId,
						category_title: entry.categoryTitle,
						tag_id: entry.tagId,
						tag_title: entry.tagTitle,
						bill_id: entry.billId,
						bill_title: entry.billTitle,
						budget_id: entry.budgetId,
						budget_title: entry.budgetTitle,
						complete: entry.complete,
						data_checked: entry.dataChecked,
						reconciled: entry.reconciled,
						transfer: entry.transfer,
						has_import_detail: !!entry.importDetail,
						other_journals: entry.otherJournals.map(oj => ({
							account_id: oj.accountId,
							account_title: oj.accountTitle,
							amount: oj.amount
						}))
					}))
				}
			};

		} catch (error) {
			return {
				success: false,
				error: `Failed to search journal entries: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
};