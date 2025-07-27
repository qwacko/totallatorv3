<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import { onMount } from 'svelte';
	import EnumSingleSelection from './EnumSingleSelection.svelte';
	import {
		llmReviewStatusEnumSelection,
		type LlmReviewStatusEnumType
	} from '../../schema/llmReviewStatusEnum';
	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';
	import type { Writable } from 'svelte/store';

	const {
		form,
		field,
		wrapperClass = undefined,
		title = 'LLM Review Status'
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		wrapperClass?: string;
		title?: string;
	} = $props();

	const { value } = formFieldProxy(form, field);
	const enumValue = $derived(value as Writable<LlmReviewStatusEnumType | undefined>);

	let currentValue = $state<LlmReviewStatusEnumType | undefined>(undefined);

	onMount(() => {
		if ($enumValue) {
			currentValue = $enumValue;
		}
	});

	$effect(() => {
		if ($enumValue !== currentValue) {
			currentValue = $enumValue;
		}
	});

	const updateValue = (newValue: LlmReviewStatusEnumType | undefined) => {
		$enumValue = newValue;
		currentValue = newValue;
	};
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
	{#if title}
		<div class="text-primary-900 flex text-sm font-semibold">
			{title}
		</div>
	{/if}
	<EnumSingleSelection
		value={currentValue}
		enumSelection={llmReviewStatusEnumSelection}
		onUpdate={updateValue}
		clearable={true}
	/>

	{#if currentValue}
		<input type="hidden" name={field} value={currentValue} />
	{/if}
</div>
