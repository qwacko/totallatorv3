<script lang="ts">
	import { Button, Modal, P } from 'flowbite-svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import UpdateJournalForm from '../../journals/clone/UpdateJournalForm.svelte';
	import UpdateJournalLinksForm from '../../journals/clone/UpdateJournalLinksForm.svelte';
	import UpdateJournalLabelsForm from '../../journals/clone/UpdateJournalLabelsForm.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import type { UpdateJournalSchemaType } from '$lib/schema/journalSchema';

	let {
		modificationFormData,
		changeModal = $bindable(false),
		id,
		changeText
	}: {
		modificationFormData: SuperValidated<UpdateJournalSchemaType>;
		changeModal: boolean;
		id: string;
		changeText: string[] | undefined;
	} = $props();

	const form = superForm(modificationFormData, {
		onResult: () => {
			changeModal = false;
		}
	});

	const modificationFormValue = $derived(form.form);
	const enhance = $derived(form.enhance);
</script>

<div class="flex flex-col gap-2">
	<P class="self-center" weight="semibold">Related Change</P>
	<div class="flex flex-row items-center gap-6 self-center">
		<div class="flex flex-col gap-1">
			<Button color="light" outline on:click={() => (changeModal = true)}>Changes</Button>
			{#if changeModal}
				<form method="post" action="?/updateChange" use:enhance>
					<Modal bind:open={changeModal} outsideclose>
						<UpdateJournalForm {form} />
						<UpdateJournalLinksForm {form} />
						<UpdateJournalLabelsForm {form} allLabelIds={[]} commonLabelIds={[]} />
						<div class="flex">
							<pre>{JSON.stringify($modificationFormValue, null, 2)}</pre>
						</div>
						<svelte:fragment slot="footer">
							<Button on:click={() => (changeModal = false)} outline>Cancel</Button>
							<div class="grow"></div>
							<PreviousUrlInput name="prevPage" routeBased />
							<input type="hidden" name="id" value={id} />
							<Button type="submit">Update</Button>
						</svelte:fragment>
					</Modal>
				</form>
			{/if}
		</div>
		<div class="flex flex-col gap-1">
			{#if changeText}
				{#each changeText as currentChangeText}
					<div class="flex">
						{currentChangeText}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
