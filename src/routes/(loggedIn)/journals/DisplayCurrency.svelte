<script lang="ts">
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

	export let format: currencyFormatType = 'USD';
	export let amount: number;

	$: formatter = getCurrencyFormatter(format);
	$: negative = amount < 0;
</script>

<div class:text-red-600={negative}>
	{formatter.format(amount)}
</div>
