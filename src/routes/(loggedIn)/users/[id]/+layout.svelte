<script lang="ts">
	import CenterCard from '$lib/components/CenterCard.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import { urlGenerator } from '$lib/routes';

	export let data;
</script>

<CenterCard title="User - {data.currentUser.username}">
	<slot />
</CenterCard>
<div class="buttonSize">
	<LinkButton href={urlGenerator({ address: '/(loggedIn)/users' }).url}>Users List</LinkButton>
</div>

<style>
	.buttonSize {
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
