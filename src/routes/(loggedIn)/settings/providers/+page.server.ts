import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { noteFormActions } from '$lib/server/noteFormActions';
import { fileFormActions } from '$lib/server/fileFormActions';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions';
import { logging } from '$lib/server/logging';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { LLMBatchProcessingService } from '$lib/server/services/llmBatchProcessingService';

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;

	// Load all LLM providers
	const providers = await tActions.llm.list({ db });

	return {
		providers
	};
};

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,
	
	update: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(submitValidation));

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.llm.update({ 
				db: db, 
				data: { enabled: form.data.status === 'active' }, 
				id: form.data.id 
			});
			return {
				status: 200,
				body: {
					message: 'LLM Provider Updated'
				}
			};
		} catch (e) {
			logging.error('LLM Provider Update Error', e);
			return error(500, 'Error updating LLM provider');
		}
	},

	processJournals: async ({ locals }) => {
		const db = locals.db;

		try {
			logging.info('Manual LLM batch processing triggered');
			
			const batchService = new LLMBatchProcessingService(db);
			const stats = await batchService.processAllAccounts();
			
			logging.info('Manual LLM batch processing completed:', stats);
			
		} catch (e) {
			logging.error('LLM Batch Processing Error:', e);
			return error(500, 'Error processing journals with LLM');
		}
		
		// Redirect back with success message after successful processing
		throw redirect(302, '/settings/providers?processed=true');
	}
};