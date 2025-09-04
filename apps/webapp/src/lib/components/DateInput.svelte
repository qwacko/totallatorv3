<script lang="ts">
	import { Button, Datepicker, type DatepickerProps, Label } from 'flowbite-svelte';
	import type { FormEventHandler } from 'svelte/elements';

	import { userInfoStore } from '$lib/stores/userInfoStore';

	import ErrorText from './ErrorText.svelte';

	let {
		errorMessage,
		title,
		name,
		required,
		value = $bindable(),
		clearable = true,
		tainted,
		highlightTainted,
		flexGrow = false,
		class: className = '',
		placeholder = 'Select date...',
		disabled,
		...restProps
	}: Omit<DatepickerProps, 'title' | 'name' | 'required' | 'value' | 'children'> & {
		errorMessage: string | string[] | null | undefined;
		title: string | null;
		name: string;
		required?: boolean | null;
		value: string | null | undefined;
		clearable?: boolean;
		tainted?: boolean;
		highlightTainted?: boolean;
		flexGrow?: boolean;
		class?: string;
	} = $props();

	const usedValue = $derived(value ? value : '');
	const clearableVisible = $derived(clearable && value);

	const handleUpdate: FormEventHandler<HTMLDivElement> = (e) => {
		const { target } = e;
		const target2 = target ? (target as unknown as HTMLInputElement) : target;
		const newValue = target2?.value ? target2.value : null;
		console.log('DateInput: handleUpdate', { newValue });
		value = newValue;
	};

	const dateFormat = $derived.by<{ format: Intl.DateTimeFormatOptions; locale: string }>(() => {
		const userDateFormat = $userInfoStore.dateFormat;

		switch (userDateFormat) {
			case 'DD/MM/YY':
				return {
					format: { day: '2-digit', month: '2-digit', year: '2-digit' },
					locale: 'en-GB'
				};
			case 'DD/MM/YYYY':
				return {
					format: { day: '2-digit', month: '2-digit', year: 'numeric' },
					locale: 'en-GB'
				};
			case 'MM/DD/YY':
				return {
					format: { day: '2-digit', month: '2-digit', year: '2-digit' },
					locale: 'en-US'
				};
			case 'MM/DD/YYYY':
				return {
					format: { day: '2-digit', month: '2-digit', year: 'numeric' },
					locale: 'en-US'
				};
			case 'YYYY-MM-DD':
				return {
					format: { year: 'numeric', month: '2-digit', day: '2-digit' },
					locale: 'en-CA'
				};
			default:
				userDateFormat satisfies never;
				throw new Error(`Unhandled date format: ${userDateFormat}`);
		}
	});
</script>

<Label class="space-y-2 {flexGrow && 'flex grow basis-0 flex-col gap-0.5'}">
	{#if title}
		<span class="flex flex-row gap-1">
			<div>
				{title}
			</div>
			<div>
				{#if required}
					*
				{/if}
			</div>
		</span>
	{/if}
	<Datepicker
		{...restProps}
		required={required || false}
		placeholder={placeholder || undefined}
		disabled={disabled || false}
		class="{className} {highlightTainted && tainted ? 'ring-2' : ''} "
		dateFormat={dateFormat.format}
		locale={dateFormat.locale}
		value={new Date(usedValue)}
		onchange={handleUpdate}
		onselect={(newDate) => {
			console.log('DateInput: onselect', { newDate });
			if (newDate instanceof Date) {
				const localDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
				const yyyy = localDate.getFullYear();
				const mm = String(localDate.getMonth() + 1).padStart(2, '0');
				const dd = String(localDate.getDate()).padStart(2, '0');
				value = `${yyyy}-${mm}-${dd}`;
			}
		}}
	>
		{#snippet actionSlot({ handleClear })}
			{#if clearableVisible}
				<div class="mt-2 flex gap-2">
					<Button size="sm" onclick={handleClear}>Clear</Button>
				</div>
			{/if}
		{/snippet}
	</Datepicker>

	<ErrorText message={errorMessage} />
</Label>
