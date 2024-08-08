<script lang="ts">
	import { Select } from 'flowbite-svelte';
	import LabelWrapper from './LabelWrapper.svelte';
	import type { ComponentProps } from 'svelte';

	type SelectProps = ComponentProps<Select>;

	let {
		errorMessage,
		title,
		name,
		required,
		value = $bindable(),
		wrapperClass,
		class: className = '',
		...restProps
	}: {
		errorMessage: string | string[] | null | undefined;
		title: string | null;
		name: string;
		required?: boolean | null;
		value: string | undefined | null;
		wrapperClass?: string;
		class?: string;
	} & Omit<SelectProps, 'value' | 'name' | 'required'> = $props();
</script>

<LabelWrapper {title} {errorMessage} {required} {wrapperClass}>
	<Select bind:value {...restProps} {name} {required} class={className} on:change on:input />
</LabelWrapper>
