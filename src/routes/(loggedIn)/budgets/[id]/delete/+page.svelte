<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { Button } from 'flowbite-svelte';

	export let data;

	let previousPage: string = '/budgets';

	afterNavigate(({ from }) => {
		previousPage = from?.url.pathname || previousPage;
	});
</script>

<PageLayout title={data.budget.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<div class="flex">Are you sure you want to delete budget {data.budget.title}?</div>

		<div class="flex flex-row gap-4 pt-4">
			<Button href={previousPage} class="flex flex-grow" outline>Cancel</Button>
			<Button type="submit" color="red" class="flex flex-grow">Delete</Button>
		</div>
	</form>
</PageLayout>
