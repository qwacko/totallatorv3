import { goto } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

type ResultType = Record<string, unknown> | undefined;
type DefaultResult = Record<string, any>;

type ActionOptions<
	SuccessType extends ResultType = DefaultResult,
	FailureType extends ResultType = DefaultResult
> = {
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
	disableDefaultAction,
	disableInvalidate,
	disableReset
}: ActionOptions<SuccessType, FailureType> = {}): SubmitFunction<SuccessType, FailureType> {
	return () => {
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
		};
	};
}

// Usage
// const mySubmitFunction = createSubmitFunction<MySuccessType, MyFailureType>();
