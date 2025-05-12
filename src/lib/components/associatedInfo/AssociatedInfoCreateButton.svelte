<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';
	import AddIcon from '../icons/AddIcon.svelte';
	import AssociatedInfoCreateForm from './AssociatedInfoCreateForm.svelte';
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';

	let {
		target,
		text = 'Create New'
	}: { target: CreateFileNoteRelationshipSchemaType; text?: string | null } = $props();

	let opened = $state(false);
</script>

<Button on:click={() => (opened = true)} class="flex flex-row items-center gap-2">
	<AddIcon />
	{#if text !== null}{text}{/if}
</Button>
<Modal bind:open={opened} title="Add Additional Information">
	<AssociatedInfoCreateForm
		{target}
		onSuccess={() => {
			console.log('Success - Closing Modal');
			opened = false;
		}}
	/>
</Modal>
