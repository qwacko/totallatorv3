<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes';
	import { Button, Input } from 'flowbite-svelte';

	export let data;
</script>

<CustomHeader pageTitle="User {data ? data.currentUser.name : ''}" />
<PageLayout title="User {data ? data.currentUser.name : ''}">
	{#if data.currentUser}
		<div class="flex flex-row gap-2 items-center">
			{data.currentUser.username}
			{#if data.currentUser.admin}
				(Admin)
			{/if}
			<div class="flex flex-grow" />
			{#if data.canSetAdmin}
				<form action="?/setAdmin" method="POST" use:enhance>
					<Button outline type="submit">Set Admin</Button>
				</form>
			{/if}
			{#if data.canRemoveAdmin}
				<form action="?/removeAdmin" method="POST" use:enhance>
					<Button outline type="submit">Remove Admin</Button>
				</form>
			{/if}

			{#if data.canUpdatePassword}
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/users/[id]/password',
						paramsValue: { id: data.currentUser.id }
					}).url}
					outline
				>
					Edit Password
				</Button>
			{/if}
			{#if data.user?.admin && data.user.userId !== data.currentUser.id}
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/users/[id]/delete',
						paramsValue: { id: data.currentUser.id }
					}).url}
					color="red"
					outline
				>
					Delete
				</Button>
			{/if}
		</div>
		<form method="post" action="?/updateName" use:enhance class="flex flex-row gap-2">
			<Input name="name" value={data.currentUser.name} />
			<Button type="submit" class="whitespace-nowrap">Update Name</Button>
		</form>
	{:else}
		<ErrorText message="User Not Found" />
	{/if}
</PageLayout>
