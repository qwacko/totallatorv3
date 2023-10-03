<script lang="ts">
	import CenterCard from '$lib/components/CenterCard.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import { urlGenerator } from '$lib/routes.js';

	export let data;
</script>

<CenterCard title="Users">
	{#each data.users as currentUser}
		<div class="userRow">
			<a
				href={urlGenerator({
					address: '/(loggedIn)/users/[id]',
					paramsValue: { id: currentUser.id }
				}).url}
			>
				{currentUser.username}
			</a>
			{#if currentUser.admin}
				(Admin)
			{/if}
		</div>
	{/each}

	<div class="gap" />
	\

	<LinkButton href={urlGenerator({ address: '/(loggedIn)/users/create' }).url}>
		Create User
	</LinkButton>
</CenterCard>

<style>
	.gap {
		height: 20px;
	}

	.userRow {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		border-bottom: 1px solid #ccc;
	}
</style>
