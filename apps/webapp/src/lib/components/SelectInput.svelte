<script lang="ts">
	import { Select, type SelectProps } from 'flowbite-svelte';

	import LabelWrapper from './LabelWrapper.svelte';

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
	} & Omit<SelectProps<string>, 'value' | 'name' | 'required'> = $props();
</script>

<LabelWrapper {title} {errorMessage} {required} {wrapperClass}>
	<Select bind:value {...restProps} {name} {required} class={className} />
</LabelWrapper>
