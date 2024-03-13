<script>
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button } from 'flowbite-svelte';
	import { enhance } from '$app/forms';

	export let data;
</script>

<CustomHeader pageTitle="Logout {data.user?.name}" />
<PageLayout title="Logout {data.user?.name}">
	<form method="post" class="flex flex-row justify-center" use:enhance>
		<Button type="submit" color="primary" size="lg" block>Logout</Button>
	</form>
</PageLayout>
