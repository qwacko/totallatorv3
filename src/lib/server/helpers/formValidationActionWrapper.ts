import { logging } from '$lib/server/logging';
import { type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { superValidate, type SuperValidated, message, type InferIn } from 'sveltekit-superforms';
import { zod, type ZodValidation, type Infer } from 'sveltekit-superforms/adapters';
import type { DBType } from '../db/db';

type ValidatedForm<T extends ZodValidation> = SuperValidated<
	Infer<T, 'zod'>,
	any,
	InferIn<T, 'zod'>
>;

type FormValidationWrapperParams<T extends ZodValidation, RequireUser extends boolean> = {
	title: string;
	validation: T;
	action: (data: {
		data: Infer<T>;
		userId: RequireUser extends true ? string : string | undefined;
		db: DBType;
		form: ValidatedForm<T>;
	}) => Promise<{ form: ValidatedForm<T> } | ActionFailure<{ form: ValidatedForm<T> }> | void>;
	requireUser?: RequireUser;
};

export const formValidationActionWrapper = <T extends ZodValidation, RequireUser extends boolean>(
	params: FormValidationWrapperParams<T, RequireUser>
): ((
	data: RequestEvent<Partial<Record<string, string>>, string>
) => Promise<{ form: ValidatedForm<T> } | ActionFailure<{ form: ValidatedForm<T> }>>) => {
	const { title, validation, action, requireUser = true } = params;

	const sanitiseFormData = (form: ValidatedForm<T>) => {
		// Remove any non-POJO items (e.g., files) from the form data
		const sanitizedData = JSON.parse(JSON.stringify(form.data));
		form.data = sanitizedData;
	};

	return async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
		const form = await superValidate(data, zod(validation));
		const creationPerson = data.locals.user?.id;

		if (!creationPerson && requireUser) {
			logging.error(`${title} : User not found`);
			throw new Error(`${title} : User not found`);
		}

		if (!form.valid) {
			logging.error(`${title} : Form Validation Error`, form.errors);
			sanitiseFormData(form);
			return { form };
		}

		try {
			const result = await action({
				data: form.data,
				userId: creationPerson as string, // Type Fixed as this makes the types work correctly.
				db: data.locals.db,
				form
			});

			if (!result) {
				sanitiseFormData(form);
				return { form };
			} else {
				if ('form' in result) {
					sanitiseFormData(result.form);
				} else {
					sanitiseFormData(result.data.form);
				}
				return result;
			}
		} catch (e) {
			logging.error(`${title} : Error`, e);
			sanitiseFormData(form);
			return message(form, `${title} : Error`);
		}
	};
};
