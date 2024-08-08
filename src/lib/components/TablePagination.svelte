<script lang="ts">
	import { ButtonGroup, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { paginationHelper } from './helpers/paginationHelper';
	import ChevronDoubleLeft from '~icons/mdi-light/chevron-double-left';
	import ChevronLeft from '~icons/mdi-light/chevron-left';
	import ChevronDoubleRight from '~icons/mdi-light/chevron-double-right';
	import ChevronRight from '~icons/mdi-light/chevron-right';
	import ArrowDownIcon from './icons/ArrowDownIcon.svelte';

	const {
		page,
		count,
		perPage,
		buttonCount = 5,
		urlForPage
	}: {
		page: number;
		count: number;
		perPage: number;
		buttonCount?: number;
		urlForPage: (pageNumber: number) => string;
	} = $props();

	const paginationInfo = $derived(paginationHelper({ page, count, perPage, buttonCount }));
</script>

<div class="flex sm:hidden">
	<Button color="light">
		Pg {page + 1} / {paginationInfo.lastPage + 1}
		<ArrowDownIcon />
	</Button>
	<Dropdown>
		<DropdownItem
			href={urlForPage(paginationInfo.firstPage)}
			disabled={!paginationInfo.enableFirst}
			data-sveltekit-noscroll
		>
			First ({paginationInfo.firstPage + 1})
		</DropdownItem>
		<DropdownItem
			href={urlForPage(paginationInfo.prevPage)}
			disabled={!paginationInfo.enablePrev}
			data-sveltekit-noscroll
		>
			Prev ({paginationInfo.prevPage + 1})
		</DropdownItem>
		{#each paginationInfo.buttons as currentButton}
			<DropdownItem
				href={urlForPage(currentButton.page)}
				disabled={currentButton.current}
				data-sveltekit-noscroll
			>
				{currentButton.title}
			</DropdownItem>
		{/each}
		<DropdownItem
			href={urlForPage(paginationInfo.nextPage)}
			disabled={!paginationInfo.enableNext}
			data-sveltekit-noscroll
		>
			Next ({paginationInfo.nextPage + 1})
		</DropdownItem>
		<DropdownItem
			href={urlForPage(paginationInfo.lastPage)}
			disabled={!paginationInfo.enableLast}
			data-sveltekit-noscroll
		>
			Last ({paginationInfo.lastPage + 1})
		</DropdownItem>
	</Dropdown>
</div>
<div class="hidden sm:flex">
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
</div>
