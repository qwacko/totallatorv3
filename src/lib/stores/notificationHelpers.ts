import { invalidateAll } from '$app/navigation';
import { notificationStore } from './notificationStore';

import type { FormResult } from 'sveltekit-superforms/client';

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
		onResult: ({ result }: { result: FormResult<Record<string, unknown>> }) => {
			setLoading && setLoading(false);
			if (result.type === 'error' || result.type === 'failure') {
				errorMessage && onError(errorMessage)();
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
