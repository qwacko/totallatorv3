<script lang="ts">
	import {
		Alert,
		Button,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { statusToDisplay } from '$lib/schema/statusSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';

	export let data;
</script>

<PageLayout title="Tags" size="lg">
	<Button href="/tags/create">Create</Button>
	<Table>
		<TableHead>
			<TableHeadCell></TableHeadCell>
			<TableHeadCell>Group</TableHeadCell>
			<TableHeadCell>Single</TableHeadCell>
			<TableHeadCell>Status</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each data.tags.data as currentTag}
				{@const detailURL = urlGenerator({
					address: '/(loggedIn)/tags/[id]',
					paramsValue: { id: currentTag.id },
					searchParamsValue: { return: $page.url.toString() }
				}).url}

				{@const deleteURL = urlGenerator({
					address: '/(loggedIn)/tags/[id]/delete',
					paramsValue: { id: currentTag.id },
					searchParamsValue: { return: $page.url.toString() }
				}).url}
				<TableBodyRow>
					<TableBodyCell>
						<center>
							<Button href={detailURL} class="p-2" outline>
								<EditIcon height={15} width={15} />
							</Button>
							<Button href={deleteURL} class="p-2" outline color="red">
								<DeleteIcon height={15} width={15} />
							</Button>
						</center>
					</TableBodyCell>
					<TableBodyCell>{currentTag.group}</TableBodyCell>
					<TableBodyCell>{currentTag.single}</TableBodyCell>
					<TableBodyCell>{statusToDisplay(currentTag.status)}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</PageLayout>
