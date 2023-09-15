<script lang="ts">
	import { ButtonGroup, Button } from 'flowbite-svelte';
	import { paginationHelper } from './helpers/paginationHelper';
	import ChevronDoubleLeft from '~icons/mdi-light/chevron-double-left';
	import ChevronLeft from '~icons/mdi-light/chevron-left';
	import ChevronDoubleRight from '~icons/mdi-light/chevron-double-right';
	import ChevronRight from '~icons/mdi-light/chevron-right';

	export let page: number;
	export let count: number;
	export let perPage: number;
	export let buttonCount: number = 5;
	export let urlForPage: (pageNumber: number) => string;

	$: paginationInfo = paginationHelper({ page, count, perPage, buttonCount });
</script>

<ButtonGroup>
	<Button
		href={urlForPage(paginationInfo.firstPage)}
		disabled={!paginationInfo.enableFirst}
		class="p-2"
	>
		<ChevronDoubleLeft />
	</Button>
	<Button
		href={urlForPage(paginationInfo.prevPage)}
		disabled={!paginationInfo.enablePrev}
		class="p-2"
	>
		<ChevronLeft />
	</Button>
	{#each paginationInfo.buttons as currentButton}
		<Button
			href={urlForPage(currentButton.page)}
			disabled={currentButton.current}
			color={currentButton.current ? 'dark' : 'light'}
		>
			{currentButton.title}
		</Button>
	{/each}

	<Button
		href={urlForPage(paginationInfo.nextPage)}
		disabled={!paginationInfo.enableNext}
		class="p-2"
	>
		<ChevronRight />
	</Button>
	<Button
		href={urlForPage(paginationInfo.lastPage)}
		disabled={!paginationInfo.enableLast}
		class="p-2"
	>
		<ChevronDoubleRight />
	</Button>
</ButtonGroup>
