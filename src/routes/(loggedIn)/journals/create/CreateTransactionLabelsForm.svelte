<script lang="ts">
	import ComboSelect from '$lib/components/ComboSelect.svelte';
	import type { CreateSimpleTransactionType } from '$lib/schema/journalSchema';
	import { Button, P } from 'flowbite-svelte';

	import type { SuperForm } from 'sveltekit-superforms';

	export let form: SuperForm<CreateSimpleTransactionType>;

	type DDINoGroup = { id: string; title: string; enabled: boolean };
	export let dropdownInfo: {
		label: Promise<DDINoGroup[]>;
	};

	let currentLabelId: string | undefined = undefined;

	$: formData = form.form;

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

	$: addSetLabel = () => setLabelToggle(currentLabelId);
	const clearSetLabel = () => ($formData.labels = undefined);

	$: enableSet =
		currentLabelId && (!$formData.labels || !$formData.labels.includes(currentLabelId));
</script>

{#await dropdownInfo.label then labelDropdown}
	<div class="flex flex-col gap-2">
		<P class="flex text-sm font-semibold">Labels</P>
		{#if $formData.labels && $formData.labels.length > 0}
			<div class="flex flex-row flex-wrap gap-2">
				{#each $formData.labels as currentLabel}
					{@const labelDetail = labelDropdown.find((item) => item.id === currentLabel)}
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
				items={labelDropdown}
				placeholder="Label Selection..."
				bind:value={currentLabelId}
				title=""
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
				itemToDisplay={(item) => ({ title: item.title })}
				class=" flex flex-grow"
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
{/await}
