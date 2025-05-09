import { createAssociatedInfoSchema } from '$lib/schema/associatedInfoSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { formValidationActionWrapper } from './helpers/formValidationActionWrapper';

export const associatedInfoFormActions = {
	createAssociatedInfo: formValidationActionWrapper({
		title: 'Create Associated Info',
		validation: createAssociatedInfoSchema,
		requireUser: true,
		action: async ({ db, data, userId, form }) => {
			console.log('Creating Associated Info');
			await tActions.associatedInfo.create({
				db,
				item: data,
				userId
			});
		}
	})
};
