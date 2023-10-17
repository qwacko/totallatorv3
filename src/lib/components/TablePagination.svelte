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
		color="light"
		href={urlForPage(paginationInfo.firstPage)}
		disabled={!paginationInfo.enableFirst}
		class="p-2"
		data-sveltekit-noscroll
	>
		<ChevronDoubleLeft />
	</Button>
	<Button
		color="light"
		href={urlForPage(paginationInfo.prevPage)}
		disabled={!paginationInfo.enablePrev}
		class="p-2"
		data-sveltekit-noscroll
	>
		<ChevronLeft />
	</Button>
	{#each paginationInfo.buttons as currentButton}
		<Button
			href={urlForPage(currentButton.page)}
			disabled={currentButton.current}
			color={currentButton.current ? 'dark' : 'light'}
			data-sveltekit-noscroll
		>
			{currentButton.title}
		</Button>
	{/each}

	<Button
		color="light"
		href={urlForPage(paginationInfo.nextPage)}
		disabled={!paginationInfo.enableNext}
		class="p-2"
		data-sveltekit-noscroll
	>
		<ChevronRight />
	</Button>
	<Button
		color="light"
		href={urlForPage(paginationInfo.lastPage)}
		disabled={!paginationInfo.enableLast}
		class="p-2"
		data-sveltekit-noscroll
	>
		<ChevronDoubleRight />
	</Button>
</ButtonGroup>
