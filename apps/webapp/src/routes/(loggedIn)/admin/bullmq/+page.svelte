<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-6">
	<Heading tag="h1" class="mb-6">BullMQ Status</Heading>

	<Card class="mb-6">
		<div class="p-6">
			<h2 class="mb-4 text-xl font-semibold">Service Status</h2>
			<div class="space-y-2">
				<div class="flex justify-between">
					<span class="font-medium">Initialized:</span>
					<span class={data.bullmqStatus.initialized ? 'text-green-600' : 'text-red-600'}>
						{data.bullmqStatus.initialized ? 'Yes' : 'No'}
					</span>
				</div>
				{#if data.bullmqStatus.error}
					<div class="flex justify-between">
						<span class="font-medium">Error:</span>
						<span class="text-red-600">{data.bullmqStatus.error}</span>
					</div>
				{/if}
			</div>
		</div>
	</Card>

	{#if data.bullmqStatus.queues}
		<Card>
			<div class="p-6">
				<h2 class="mb-4 text-xl font-semibold">Queue Status</h2>
				<div class="space-y-4">
					{#each Object.entries(data.bullmqStatus.queues) as [queueName, queueStatus]}
						<div class="rounded-lg border p-4">
							<h3 class="mb-2 font-semibold capitalize">{queueName} Queue</h3>
							<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div>
									<span class="font-medium">Waiting:</span>
									<span class="ml-2">{queueStatus.waiting}</span>
								</div>
								<div>
									<span class="font-medium">Active:</span>
									<span class="ml-2">{queueStatus.active}</span>
								</div>
								<div>
									<span class="font-medium">Completed:</span>
									<span class="ml-2 text-green-600">{queueStatus.completed}</span>
								</div>
								<div>
									<span class="font-medium">Failed:</span>
									<span class="ml-2 text-red-600">{queueStatus.failed}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	{/if}
</div>
