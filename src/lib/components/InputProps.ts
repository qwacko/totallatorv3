import { type FormSizeType, type InputType } from 'flowbite-svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { FormPathLeaves, SuperForm } from 'sveltekit-superforms';

export type TextInputProps = Omit<HTMLInputAttributes, 'size'> & {
	type?: InputType;
	value?: any;
	size?: FormSizeType;
	clearable?: boolean;
	defaultClass?: string;
	color?: 'base' | 'green' | 'red';
	floatClass?: string;
	classLeft?: string;
	classRight?: string;
	wrapperClass?: string;
};

export type TextInputFormProps<T extends Record<string | number | symbol, unknown>> = {
	form: SuperForm<T>;
	field: FormPathLeaves<T>;
	wrapperClass?: string;
	outerWrapperClass?: string;
	title: string | null;
	highlightTainted?: boolean;
	clearable?: boolean;
	clearField?: FormPathLeaves<T>;
	class?: string;
} & Omit<
	TextInputProps,
	| 'title'
	| 'name'
	| 'value'
	| 'errorMessage'
	| 'tainted'
	| 'highlightTainted'
	| 'wrapperClass'
	| 'outerWrapperClass'
	| 'form'
	| 'field'
>;

export type TextInputFormMinimalProps<T extends Record<string | number | symbol, unknown>> = {
	form: SuperForm<T>;
	field: FormPathLeaves<T>;
	wrapperClass?: string;
	outerWrapperClass?: string;
	title: string | null;
	highlightTainted?: boolean;
	clearable?: boolean;
	clearField?: FormPathLeaves<T>;
	class?: string;
};
