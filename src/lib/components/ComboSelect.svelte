<script lang="ts" context="module">
	import type { IDRecord, OptionFunction, DisplayFunction } from './ComboSelectTypes';
</script>

<script lang="ts" generics="T extends IDRecord">
	import { createCombobox, melt } from '@melt-ui/svelte';
	import ChevronDown from '~icons/mdi/chevron-down';
	import ChevronUp from '~icons/mdi/chevron-up';
	import Check from '~icons/mdi/check';
	import { fly } from 'svelte/transition';
	import HighlightText from './HighlightText.svelte';
	import { Button, Label } from 'flowbite-svelte';

	export let items: T[];
	export let filterItems: (data: T[], target: string) => T[] = (items, search) => {
		return items.filter((item) => {
			const display = itemToDisplay(item);
			const titleFound = display.title.toLowerCase().includes(search);
			const groupFound = display.group ? display.group.toLowerCase().includes(search) : false;

			return titleFound || groupFound;
		});
	};
	export let placeholder = 'Select Item...';
	export let title: string | undefined | null;
	export let itemToOption: OptionFunction<T>;
	export let itemToDisplay: DisplayFunction<T>;
	export let highlightSearch = true;
	export let value: string | undefined | null;
	export let name: string | undefined = undefined;
	export let clearValue: boolean | undefined = undefined;
	export let clearable = false;
	export let clearName: string | undefined = undefined;
	export let tainted: boolean | undefined = undefined;
	export let highlightTainted: boolean = true;

	const {
		elements: { menu, input, option, label },
		states: { open, inputValue, touchedInput, selected },
		helpers: { isSelected, isHighlighted }
	} = createCombobox<string>({
		forceVisible: true,
		onSelectedChange: (newSelection) => {
			const newValue = newSelection.next ? newSelection.next?.value : undefined;
			value = newValue;
			if (newValue !== undefined) {
				clearValue = undefined;
			}
			return newSelection.next;
		}
	});

	const clearSelection = () => {
		clearValue = true;
		value = undefined;
	};

	const updateSelection = (id: string | undefined | null) => {
		if (id) {
			const selection = items.find((item) => item.id === id);
			if (!selection) {
				$selected = undefined;
				$inputValue = '';
			} else {
				const itemOption = itemToOption(selection);
				$selected = itemOption;
				$inputValue = itemOption.label;
			}
		} else {
			$selected = undefined;
			$inputValue = '';
		}
	};

	//Updates selection when the external value changes.
	$: updateSelection(value);

	$: filteredItems = $touchedInput ? filterItems(items, $inputValue.toLowerCase()) : items;
	$: selectedVal = $selected ? $selected.value : undefined;
</script>

{#if name && selectedVal}
	<input type="hidden" {name} value={selectedVal} />
{/if}
{#if clearable && clearName}
	<input type="hidden" name={clearName} value={clearValue === true ? 'true' : 'false'} />
{/if}
<div class="flex flex-col gap-2">
	{#if title}
		<Label {...$label}>{title}</Label>
	{/if}

	<div class="flex flex-row w-full gap-2">
		<div class="relative flex flex-grow">
			<input
				{...$input}
				use:input
				class="block w-full disabled:cursor-not-allowed disabled:opacity-50 p-2.5 focus:border-primary-500
            focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500
            bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
            border-gray-300 dark:border-gray-600 text-sm rounded-lg border {tainted &&
				highlightTainted
					? 'ring-2'
					: ''}"
				{placeholder}
			/>
			<div class="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-magnum-900">
				{#if $open}
					<ChevronUp class="square-4" />
				{:else}
					<ChevronDown class="square-4" />
				{/if}
			</div>
		</div>
		{#if clearable}
			<Button on:click={clearSelection} color="light" disabled={clearValue}>Clear</Button>
		{/if}
	</div>
</div>
{#if $open}
	<ul
		class="z-10 flex max-h-[300px] flex-col overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-700"
		{...$menu}
		use:menu
		transition:fly={{ duration: 150, y: -5 }}
	>
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div class="flex max-h-full flex-col gap-0 overflow-y-auto px-2 py-2 text-black" tabindex="0">
			{#each filteredItems as currentItem (currentItem.id)}
				{@const currentItemDisplay = itemToDisplay(currentItem)}
				{@const currentHighlighted = $isHighlighted(currentItem.id)}
				{@const currentSelected = $isSelected(currentItem.id)}
				{@const currentItemOption = itemToOption(currentItem)}

				<li
					{...$option(currentItemOption)}
					use:option
					class="relative cursor-pointer scroll-my-2 rounded-md py-2 pl-4 pr-4
        data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900
          data-[disabled]:opacity-50 {currentHighlighted ? 'bg-gray-200' : ''}"
				>
					{#if currentSelected}
						<div class="check absolute left-2 top-1/2 z-10 text-magnum-900">
							<Check class="square-4" />
						</div>
					{/if}
					<div class="pl-4">
						<span class="font-medium">
							<HighlightText
								text={currentItemDisplay.title}
								searchText={$inputValue}
								highlight={highlightSearch}
							/>
						</span>
						{#if currentItemDisplay.group}
							<span class="block text-sm opacity-75">
								<HighlightText
									text={currentItemDisplay.group}
									searchText={$inputValue}
									highlight={highlightSearch}
								/>
							</span>
						{/if}
					</div>
				</li>
			{:else}
				<li
					class="relative cursor-pointer rounded-md py-1 pl-8 pr-4
        data-[highlighted]:bg-magnum-100 data-[highlighted]:text-magnum-700"
				>
					No results found
				</li>
			{/each}
		</div>
	</ul>
{/if}

<style>
	.check {
		translate: 0 calc(-50% + 1px);
	}
</style>
