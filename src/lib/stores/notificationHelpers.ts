import { invalidateAll } from '$app/navigation';
import type { ActionResult } from '@sveltejs/kit';
import { notificationStore } from './notificationStore';
import { z } from 'zod';

export const onSuccess = (notification: string, action?: () => void) => {
	return () => {
		notificationStore.send({
			message: notification,
			type: 'success',
			duration: 2000
		});
		action && action();
	};
};

export const onError = (notification: string, action?: () => void) => {
	return () => {
		notificationStore.send({
			message: notification,
			type: 'error',
			duration: 8000,
			dismissable: true
		});
		action && action();
	};
};

export const superFormNotificationHelper = ({
	setLoading,
	errorMessage,
	successMessage,
	invalidate = false
}: {
	setLoading?: (newValue: boolean) => void;
	successMessage?: string;
	errorMessage?: string;
	invalidate?: boolean;
}) => {
	return {
		onSubmit: () => {
			setLoading && setLoading(true);
		},
		onResult: ({ result }: { result: ActionResult }) => {
			setLoading && setLoading(false);
			if (result.type === 'error' || result.type === 'failure') {
				let message = errorMessage;
				const resultSchema = z.object({
					data: z.object({ form: z.object({ message: z.string() }) })
				});
				const parsedResult = resultSchema.safeParse(result);
				if (parsedResult.success) {
					message = parsedResult.data.data.form.message;
				}
				message && message.length > 0 && onError(message)();
			}
			if (result.type === 'success') {
				successMessage && onSuccess(successMessage)();
			}

			if (invalidate) {
				invalidateAll();
			}
		}
	};
};
