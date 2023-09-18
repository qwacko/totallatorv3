<script lang="ts">
	import { enhance } from '$app/forms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button, Heading } from 'flowbite-svelte';

	export let data;
</script>

<PageLayout title="Bulk Actions">
	<div class="flex flex-col gap-2">
		<Heading tag="h3">Create Accounts</Heading>
		<div class="flex">
			Currently : {data.accountCount} Accounts Exist - {data.deletableAccountCount} can be deleted
		</div>
		<div class="flex flex-row gap-2">
			{#each data.accountCreationOptions as currentOption}
				<form class="flex" method="POST" action="?/bulkAddAccounts" use:enhance>
					<input type="hidden" name="countIncome" value={currentOption.income} />
					<input type="hidden" name="countExpenses" value={currentOption.expense} />
					<input type="hidden" name="countAssets" value={currentOption.asset} />
					<input type="hidden" name="countLiabilities" value={currentOption.liability} />
					<Button type="submit" outline>{currentOption.title}</Button>
				</form>
			{/each}
			<form class="flex" method="POST" action="?/deleteUnusedAccounts" use:enhance>
				<Button type="submit" outline color="red"
					>Delete {data.deletableAccountCount} Unused Accounts</Button
				>
			</form>
		</div>
	</div>
</PageLayout>
