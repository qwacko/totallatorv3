<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import type { AssociatedInfoDataType } from '$lib/server/db/actions/associatedInfoActions';
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import AssociatedInfoButton from './AssociatedInfoButton.svelte';
	const {
		data,
		target
	}: {
		data?: Promise<AssociatedInfoDataType[]> | null;
		target: CreateFileNoteRelationshipSchemaType;
		id: string;
	} = $props();

	let open = $state(false);
	const setOpen = (newOpen: boolean) => {
		open = newOpen;
	};
</script>

{#if data}
	{#await data}
		<Button class="p-2">
			<Spinner size="4" />
		</Button>
	{:then targetData}
		<AssociatedInfoButton {open} {setOpen} {target} data={targetData} />
	{/await}
{:else}
	<AssociatedInfoButton {open} {setOpen} {data} {target} />
{/if}
