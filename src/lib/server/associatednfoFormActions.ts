import { createAssociatedInfoSchema } from '$lib/schema/associatedInfoSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { formValidationActionWrapper } from './helpers/formValidationActionWrapper';
import { z } from 'zod';

export const associatedInfoFormActions = {
	createAssociatedInfo: formValidationActionWrapper({
		title: 'Create Associated Info',
		validation: createAssociatedInfoSchema,
		requireUser: true,
		action: async ({ db, data, userId, form }) => {
			await tActions.associatedInfo.create({
				db,
				item: data,
				userId
			});
		}
	}),
	deleteSummary: formValidationActionWrapper({
		title: 'Delete Journal Summary',
		validation: z.object({ summaryId: z.string() }),
		requireUser: true,
		action: async ({ db, data, userId, form }) => {
			await tActions.associatedInfo.removeSummary({ db, data: { id: data.summaryId } });
		}
	})
};
