<script lang="ts">
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

	export let format: currencyFormatType = 'USD';
	export let amount: number | undefined;
	export let positiveGreen = false;

	$: formatter = getCurrencyFormatter(format);
	$: negative = amount && amount < 0;
	$: positive = !negative && positiveGreen;
</script>

<div class:text-red-600={negative} class:text-green-400={positive}>
	{#if positive}+{/if}{formatter.format(amount || 0)}
</div>
