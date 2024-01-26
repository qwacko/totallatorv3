<script lang="ts">
	import { Select } from 'flowbite-svelte';
	import LabelWrapper from './LabelWrapper.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null;
	export let name: string;
	export let required: boolean | undefined | null = undefined;
	export let value: string | undefined;
	export let wrapperClass: string | undefined = undefined;
</script>

<LabelWrapper {title} {errorMessage} {required} {wrapperClass}>
	<Select bind:value {...$$restProps} {name} {required} class={$$props.class} on:change on:input />
</LabelWrapper>
