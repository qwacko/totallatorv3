import { logging } from '$lib/server/logging';

export const actions = {
	update: async (data) => {
		const form = await data.request.formData();
		logging.info('Journal Form : ', form);
	}
};
