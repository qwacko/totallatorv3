import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import {
	importMappingCreateFormSchema,
	importMappingDetailSchema
} from '$lib/schema/importMappingSchema.js';
import { superValidate } from 'sveltekit-superforms/client';

export const load = (data) => {
	authGuard(data);
	serverPageInfo(data.route.id, data);

	const form = superValidate({ title: '', configuration: '' }, importMappingCreateFormSchema);
	const detailForm = superValidate({}, importMappingDetailSchema);

	return { form, detailForm, title: 'Hello' };
};
