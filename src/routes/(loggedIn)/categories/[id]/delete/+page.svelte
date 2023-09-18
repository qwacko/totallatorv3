<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button } from 'flowbite-svelte';

	export let data;

	let previousPage: string = '/categories';

	afterNavigate(({ from }) => {
		previousPage = from?.url.href || previousPage;
	});
</script>

<PageLayout title={data.category.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<div class="flex">Are you sure you want to delete category {data.category.title}?</div>

		<div class="flex flex-row gap-4 pt-4">
			<Button href={previousPage} class="flex flex-grow" outline>Cancel</Button>
			<Button type="submit" color="red" class="flex flex-grow">Delete</Button>
		</div>
	</form>
</PageLayout>
