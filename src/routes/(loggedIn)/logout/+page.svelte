<script>
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button } from 'flowbite-svelte';
	import { enhance } from '$app/forms';

	const { data } = $props();
</script>

<CustomHeader pageTitle="Logout {data.user?.name}" />
<PageLayout title="Logout {data.user?.name}">
	<form method="post" class="flex flex-row justify-center" use:enhance>
		<Button type="submit" color="primary" size="lg">Logout</Button>
	</form>
</PageLayout>
