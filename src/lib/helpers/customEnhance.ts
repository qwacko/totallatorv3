import { goto } from '$app/navigation';
import { onSuccess, onError } from '$lib/stores/notificationHelpers';
import { fail, type SubmitFunction } from '@sveltejs/kit';

type ResultType = Record<string, unknown> | undefined;
type DefaultResult = Record<string, any>;

type ActionOptions<
	SuccessType extends ResultType = DefaultResult,
	FailureType extends ResultType = DefaultResult
> = {
	onSubmit?: (data: {
		action: URL;
		formData: FormData;
		cancel: () => void;
	}) => void | Promise<void>;
	onSuccess?: (data: {
		action: URL;
		formData: FormData;
		data: SuccessType | undefined;
	}) => void | Promise<void>;
	onFailure?: (data: {
		action: URL;
		formData: FormData;
		data: FailureType | undefined;
		defaultAction: () => void;
	}) => void | Promise<void>;
	onError?: (data: {
		action: URL;
		formData: FormData;
		status: Number | undefined;
		error: any;
		defaultAction: () => void;
	}) => void | Promise<void>;
	onRedirect?: (data: {
		action: URL;
		location: string;
		formData: FormData;
		status: number;
		defaultAction: () => void;
	}) => void | Promise<void>;
	updateLoading?: (loading: boolean) => void;
	disableDefaultAction?: boolean;
	disableReset?: boolean;
	disableInvalidate?: boolean;
};

export function customEnhance<
	SuccessType extends ResultType = DefaultResult,
	FailureType extends ResultType = DefaultResult
>({
	onSuccess,
	onFailure,
	onError,
	onRedirect,
	onSubmit,
	disableDefaultAction,
	disableInvalidate,
	disableReset,
	updateLoading
}: ActionOptions<SuccessType, FailureType> = {}): SubmitFunction<SuccessType, FailureType> {
	return ({ action, formData, cancel }) => {
		updateLoading && updateLoading(true);
		onSubmit && onSubmit({ action, formData, cancel });

		return async ({ result, action, formData, update, formElement }) => {
			// `result` is an `ActionResult` object

			if (result.type === 'redirect') {
				const defaultAction = () => goto(result.location);
				if (onRedirect) {
					await onRedirect({
						action,
						formData,
						location: result.location,
						status: result.status,
						defaultAction
					});
				} else {
					defaultAction();
				}
			} else if (result.type === 'error') {
				const defaultAction = () => console.error(`${action} error`, result);
				if (onError) {
					await onError({
						action,
						formData,
						status: result.status,
						error: result.error,
						defaultAction
					});
				} else {
					defaultAction();
				}
			} else if (result.type === 'failure') {
				const defaultAction = () => console.log('Result Error : ', result);
				if (onFailure) {
					await onFailure({ action, formData, data: result.data, defaultAction });
				} else {
					defaultAction();
				}
			} else if (result.type === 'success') {
				if (onSuccess) {
					await onSuccess({ action, formData, data: result.data });
				}
			}

			if (!disableDefaultAction) {
				await update({
					invalidateAll: !disableInvalidate,
					reset: !disableReset
				});
			}

			updateLoading && updateLoading(false);
		};
	};
}
export const defaultCustomEnhance = <SuccessType extends ResultType = DefaultResult>({
	updateLoading,
	onSuccess: onSuccessInternal,
	onFailure: onFailureInternal,
	defaultSuccessMessage = 'Success',
	defaultFailureMessage = 'Failure'
}: {
	updateLoading?: (newValue: boolean) => void;
	onSuccess?: () => void;
	onFailure?: (message: string) => void;
	defaultSuccessMessage?: string;
	defaultFailureMessage?: string;
}) =>
	customEnhance<SuccessType, { message: string }>({
		onFailure: ({ data, defaultAction }) => {
			onError(data?.message || defaultFailureMessage)();
			onFailureInternal && onFailureInternal(data?.message || defaultFailureMessage);
			defaultAction();
		},
		onSuccess: () => {
			onSuccess(defaultSuccessMessage)();
			onSuccessInternal && onSuccessInternal();
		},
		updateLoading
	});

export const failWrapper = (message: string) => fail(402, { message });

// Usage
// const mySubmitFunction = createSubmitFunction<MySuccessType, MyFailureType>();
