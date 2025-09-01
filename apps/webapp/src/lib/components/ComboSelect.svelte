<script lang="ts" module>
	import type { DisplayFunction, IDRecord, OptionFunction } from './ComboSelectTypes';
</script>

<script lang="ts" generics="T extends IDRecord">
	import { createCombobox } from '@melt-ui/svelte';
	import { Button, Input, Label, P, Spinner } from 'flowbite-svelte';
	import { type Snippet, untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import Check from '~icons/mdi/check';
	import ChevronDown from '~icons/mdi/chevron-down';
	import ChevronUp from '~icons/mdi/chevron-up';

	import HighlightText from './HighlightText.svelte';

	const maxItemsDisplay = 20;

	type FilterFunction<U extends IDRecord> = (data: U[], target: string) => U[];

	type PropsType = {
		items: T[] | undefined;
		filterItems?: FilterFunction<T>;
		placeholder?: string;
		title?: string | null;
		itemToOption: OptionFunction<T>;
		itemToDisplay: DisplayFunction<T>;
		highlightSearch?: boolean;
		value: string | undefined | null;
		onChange?: (data: string | undefined) => void;
		name?: string;
		clearValue?: boolean;
		clearable?: boolean;
		clearName?: string;
		creatable?: boolean;
		createValue?: string | undefined | null;
		createName?: string;
		createDesc?: string;
		tainted?: boolean;
		highlightTainted?: boolean;
		class?: string;
		children?: Snippet;
	};

	const defaultFilterItems: FilterFunction<T> = (items, search) => {
		return items
			.filter((item) => {
				const display = itemToDisplay(item);
				const titleFound = display.title.toLowerCase().includes(search);
				const groupFound = display.group ? display.group.toLowerCase().includes(search) : false;

				return titleFound || groupFound;
			})
			.slice(0, maxItemsDisplay);
	};

	let {
		items,
		filterItems = defaultFilterItems,
		placeholder = 'Select Item...',
		title,
		itemToOption,
		itemToDisplay,
		highlightSearch = true,
		value = $bindable(),
		onChange,
		name,
		clearValue = $bindable(),
		clearable = false,
		clearName,
		creatable = false,
		createValue = $bindable(),
		createName,
		createDesc = 'Create',
		tainted,
		highlightTainted = true,
		class: className = '',
		children
	}: PropsType = $props();

	const {
		elements: { menu, input, option, label },
		states: { open, inputValue, touchedInput, selected },
		helpers: { isSelected, isHighlighted }
	} = createCombobox<string>({
		forceVisible: true,
		onSelectedChange: (newSelection) => {
			if (!items) return;
			const newValue = newSelection.next ? newSelection.next?.value : undefined;
			value = newValue;
			onChange && onChange(newValue);
			if (newValue !== undefined) {
				clearValue = undefined;
				createValue = undefined;
			}
			return newSelection.next;
		}
	});

	const clearSelection = () => {
		if (!items) return;
		clearValue = true;
		value = undefined;
		createValue = undefined;
		targetCreate = '';
	};

	const setCreate = () => {
		if (!items) return;
		clearValue = false;
		value = undefined;
		$open = false;
		if (targetCreate === undefined || targetCreate.length === 0) {
			targetCreate = createDesc;
		}
		createValue = targetCreate;
	};

	const cancelCreate = () => {
		clearValue = false;
		value = undefined;
		createValue = undefined;
		targetCreate = '';
	};

	const updateSelection = (id: string | undefined | null) => {
		if (!items) return;
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

	let targetCreate = $state<string>('');

	const updateTargetCreate = (newTarget: string | undefined) => {
		if (newTarget && newTarget.length > 0) {
			targetCreate = newTarget;
		}
	};

	//Updates selection when the external value changes.
	$effect(() => {
		items && untrack(() => updateSelection)(value);
	});

	const filteredItems = $derived(
		!items
			? undefined
			: $touchedInput
				? filterItems(items, $inputValue.toLowerCase())
				: items.slice(0, maxItemsDisplay)
	);
	const selectedVal = $derived($selected ? $selected.value : undefined);
	$effect(() => {
		untrack(() => updateTargetCreate)($inputValue);
	});
</script>

<div class="flex flex-col gap-2 {className} @container">
	{#if name && selectedVal}
		<input type="hidden" {name} value={selectedVal} />
	{/if}
	{#if clearable && clearName}
		<input type="hidden" name={clearName} value={clearValue === true ? 'true' : 'false'} />
	{/if}
	{#if creatable && createName}
		<input type="hidden" name={createName} value={createValue} />
	{/if}
	{#if title}
		<Label {...$label}>{title}</Label>
	{/if}

	<div class="@md:flex-row flex w-full flex-col gap-2">
		{#if !items}
			<div class="flex flex-row items-center gap-2">
				<Spinner size="4" /><P size="sm" weight="semibold" class="text-gray-400">Loading...</P>
			</div>
		{:else if createValue !== undefined && createValue !== null}
			<P size="sm" class="self-center whitespace-nowrap">{createDesc}</P>
			<Input bind:value={createValue} />
			<Button outline onclick={cancelCreate}>Cancel</Button>
		{:else}
			<div class="relative flex grow">
				<input
					{...$input}
					use:input
					class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full
            rounded-lg border border-gray-300
            bg-gray-50 p-2.5 text-sm text-gray-900 disabled:cursor-not-allowed
            disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 {tainted &&
					highlightTainted
						? 'ring-2'
						: ''}"
					{placeholder}
				/>
				<div class="text-magnum-900 absolute right-2 top-1/2 z-10 -translate-y-1/2">
					{#if $open}
						<ChevronUp class="square-4" />
					{:else}
						<ChevronDown class="square-4" />
					{/if}
				</div>
			</div>
			<div class="flex flex-row gap-2 self-stretch">
				{#if creatable && createValue === undefined}
					<Button
						onclick={setCreate}
						class="@md:grow-0 @md:whitespace-nowrap flex grow basis-0"
						color="light"
					>
						{createDesc}
					</Button>
				{/if}
				{#if clearable}
					<Button
						onclick={clearSelection}
						class="@md:grow-0 @md:whitespace-nowrap flex grow basis-0"
						color="light"
						disabled={clearValue}
					>
						Clear
					</Button>
				{/if}
			</div>
		{/if}
	</div>
	{#if children}
		{@render children()}
	{/if}
</div>
{#if $open && items && filteredItems}
	<ul
		class="z-[100] flex max-h-[300px] flex-col overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-700"
		{...$menu}
		use:menu
		transition:fly={{ duration: 150, y: -5 }}
	>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="flex max-h-full flex-col gap-0 overflow-y-auto px-2 py-2 text-black dark:text-gray-700"
			tabindex="0"
		>
			{#each filteredItems as currentItem (currentItem.id)}
				{@const currentItemDisplay = itemToDisplay(currentItem)}
				{@const currentHighlighted = $isHighlighted(currentItem.id)}
				{@const currentSelected = $isSelected(currentItem.id)}
				{@const currentItemOption = itemToOption(currentItem)}

				<li
					{...$option(currentItemOption)}
					use:option
					class="data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900 relative cursor-pointer scroll-my-2 rounded-md py-2
        pl-4 pr-4
          data-[disabled]:opacity-50 {currentHighlighted ? 'bg-gray-200' : ''}"
				>
					{#if currentSelected}
						<div class="check text-magnum-900 absolute left-2 top-1/2 z-10">
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
					{#if creatable}
						<div class="flex flex-row gap-1 items-center">
							<div class="flex">No results found</div>
							<Button outline size="sm" onclick={setCreate}>{createDesc} - {$inputValue}</Button>
						</div>
					{:else}
						No results found
					{/if}
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
