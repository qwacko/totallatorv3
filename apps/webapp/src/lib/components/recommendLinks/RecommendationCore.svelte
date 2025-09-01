<script lang="ts" generics="ParamType extends any">
	import { Button } from 'flowbite-svelte';
	import { untrack } from 'svelte';

	type ReturnType = {
		recommendations: {
			id: string;
			title: string;
			count: number;
			fraction: number;
		}[];
	};

	const {
		params,
		getItems,
		currentId,
		updateId
	}: {
		params: ParamType;
		getItems: (params: ParamType) => Promise<ReturnType>;
		currentId?: string;
		updateId: (id: string) => void;
	} = $props();

	let delayedParams = $state<ParamType | undefined>(undefined);

	let timeout = $state<NodeJS.Timeout | undefined>(undefined);

	$effect(() => {
		params;
		untrack(() => {
			clearTimeout(timeout);

			timeout = setTimeout(() => {
				delayedParams = params;
			}, 300);
		});
	});
</script>

{#if currentId === undefined && delayedParams !== undefined}
	<svelte:boundary>
		<div class="flex flex-row flex-wrap gap-2 self-stretch">
			{#each (await getItems(delayedParams)).recommendations as data}
				<Button
					class="@md:grow-0 @md:whitespace-nowrap flex grow basis-0"
					color="alternative"
					onclick={() => updateId(data.id)}
				>
					{(data.fraction * 100).toFixed(0)}% - {data.title}
				</Button>
			{/each}
		</div>
		{#snippet pending()}Loading recommendations...{/snippet}
	</svelte:boundary>
{/if}
