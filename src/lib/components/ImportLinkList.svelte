<script lang="ts">
	import { Badge, Button, Heading, P } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes';
	import {
		type ImportFilterSchemaType,
		importStatusToColour,
		importStatusToTest
	} from '$lib/schema/importSchema';
	import type { ImportDetailList } from '$lib/server/db/actions/importActions';
	import ImportCountBadges from '$lib/components/ImportCountBadges.svelte';

	export let data: ImportDetailList;
	export let filter: ImportFilterSchemaType;
	export let title: string;
</script>

{#if data.length === 0}
	<Heading tag="h4">No Imports found</Heading>
{:else}
	<div class="flex flex-col items-stretch gap-2">
		<div class="flex flex-row items-center">
			<div class="flex">
				<Heading tag="h4">{title}</Heading>
			</div>
			<div class="flex grow" />
			<Button
				color="light"
				href={urlGenerator({ address: '/(loggedIn)/import', searchParamsValue: filter }).url}
			>
				Show All
			</Button>
		</div>
		{#each data as currentImport}
			<a
				href={urlGenerator({
					address: '/(loggedIn)/import/[id]',
					paramsValue: { id: currentImport.detail.id }
				}).url}
				class="flex flex-col gap-2 rounded-md border p-4 shadow-md hover:bg-gray-100"
			>
				<div class="flex flex-row">
					<P weight="light" class="flex">
						{currentImport.detail.createdAt.toISOString().slice(0, 10)}
					</P>
					<div class="flex grow" />
					<Badge color={importStatusToColour(currentImport.detail.status)}>
						{importStatusToTest(currentImport.detail.status)}
					</Badge>
				</div>
				<div class="flex flex-row items-center gap-2">
					<P weight="semibold" italic class="flex">Filename:</P>
					<P weight="light" class="flex">{currentImport.detail.title}</P>
					<P weight="semibold" italic class="flex">Process:</P>
					<Badge color={currentImport.detail.autoProcess ? 'green' : 'yellow'}>
						{#if currentImport.detail.autoProcess}Auto{:else}Manual{/if}
					</Badge>

					<P weight="semibold" italic class="flex">Clean:</P>
					<Badge color={currentImport.detail.autoClean ? 'green' : 'yellow'}>
						{#if currentImport.detail.autoClean}Auto{:else}Manual{/if}
					</Badge>
				</div>
				<div class="flex flex-row gap-2">
					<ImportCountBadges importData={currentImport} hideZero />
				</div>
			</a>
		{/each}
	</div>
{/if}
