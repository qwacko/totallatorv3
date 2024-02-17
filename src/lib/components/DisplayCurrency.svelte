<script lang="ts">
	import { getCurrencyFormatter } from '$lib/schema/userSchema';
	import { currencyFormat } from '$lib/stores/userInfoStore';

	export let amount: number | undefined;
	export let positiveGreen = false;

	$: formatter = getCurrencyFormatter($currencyFormat);
	$: negative = amount && amount < 0;
	$: positive = !negative && positiveGreen;
</script>

<div class:text-red-600={negative} class:text-green-400={positive}>
	{#if positive}+{/if}{formatter.format(amount || 0)}
</div>
