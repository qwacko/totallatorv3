<script lang="ts">
	import ComboSelect from '$lib/components/ComboSelect.svelte';
	import type { CreateSimpleTransactionType } from '$lib/schema/journalSchema';
	import { Button, P } from 'flowbite-svelte';
	import { labelDropdownData } from '$lib/stores/dropdownStores.js';

	import type { SuperForm } from 'sveltekit-superforms';

	const { form }: { form: SuperForm<CreateSimpleTransactionType> } = $props();

	let currentLabelId = $state<string | undefined>(undefined);

	const formData = $derived(form.form);

	const setLabelToggle = (labelId: string | undefined) => {
		if (labelId) {
			if ($formData.labels) {
				if ($formData.labels.includes(labelId)) {
					$formData.labels = $formData.labels.filter((item) => item !== labelId);
				} else {
					$formData.labels = [...$formData.labels, labelId];
				}
			} else {
				$formData.labels = [labelId];
			}
		}
	};

	const addSetLabel = $derived(() => setLabelToggle(currentLabelId));
	const clearSetLabel = () => ($formData.labels = undefined);
	const enableSet = $derived(
		currentLabelId && (!$formData.labels || !$formData.labels.includes(currentLabelId))
	);
</script>

<div class="flex flex-col gap-2">
	<P class="flex text-sm font-semibold">Labels</P>
	{#if $formData.labels && $formData.labels.length > 0 && $labelDropdownData}
		<div class="flex flex-row flex-wrap gap-2">
			{#each $formData.labels as currentLabel}
				{@const labelDetail = $labelDropdownData.find((item) => item.id === currentLabel)}
				{#if labelDetail}
					<div>
						<input type="hidden" name="labels" value={labelDetail.id} />
						<Button outline size="xs" on:click={() => setLabelToggle(labelDetail.id)}>
							{labelDetail.title}
						</Button>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
	<div class="flex flex-row gap-2">
		<ComboSelect
			items={$labelDropdownData}
			placeholder="Label Selection..."
			bind:value={currentLabelId}
			title=""
			itemToOption={(item) => ({
				label: item.title,
				value: item.id,
				disabled: !item.enabled
			})}
			itemToDisplay={(item) => ({ title: item.title })}
			class=" flex grow"
		/>
		<Button on:click={addSetLabel} disabled={!enableSet} class="h-min self-end">Add</Button>
		<Button
			on:click={clearSetLabel}
			disabled={!($formData.labels && $formData.labels.length > 0)}
			class="h-min self-end"
			outline
		>
			Clear
		</Button>
	</div>
</div>
