<script lang="ts">
	import {
		Badge,
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/users', () => page);
</script>

<CustomHeader pageTitle="Users" numPages={data.numPages} pageNumber={data.page} />

<PageLayout title="Users">
	{#if data.numberOfUsers > 0}
		<div class="flex flex-row justify-center">
			<TablePagination
				count={data.numberOfUsers}
				page={data.page}
				perPage={data.perPage}
				buttonCount={5}
				urlForPage={(newPage) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: newPage } }).url}
			/>
		</div>
		<Table>
			<TableHead>
				<TableHeadCell>Username</TableHeadCell>
				<TableHeadCell>User</TableHeadCell>
				<TableHeadCell>Access</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each data.users as currentUser}
					<TableBodyRow>
						<TableBodyCell>
							<Button
								href={urlGenerator({
									address: '/(loggedIn)/users/[id]',
									paramsValue: { id: currentUser.id }
								}).url}
								outline
							>
								{currentUser.username}
							</Button>
						</TableBodyCell>

						<TableBodyCell>
							{currentUser.name}
						</TableBodyCell>
						<TableBodyCell>
							{#if currentUser.admin}
								Admin
							{:else}
								User
							{/if}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{:else}
		<Badge color="blue" class="p-4">No Users Found</Badge>
	{/if}

	<Button href={urlGenerator({ address: '/(loggedIn)/users/create' }).url} color="blue">
		Create User
	</Button>
</PageLayout>
