import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { createAssociatedInfoSchema } from '@totallator/shared';

import { formValidationActionWrapper } from './helpers/formValidationActionWrapper';

export const associatedInfoFormActions = {
	createAssociatedInfo: formValidationActionWrapper({
		title: 'Create Associated Info',
		validation: createAssociatedInfoSchema,
		requireUser: true,
		action: async ({ db, data, userId, form }) => {
			await tActions.associatedInfo.create({
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
			await tActions.associatedInfo.removeSummary({
				db,
				data: { id: data.summaryId }
			});
		}
	})
};
