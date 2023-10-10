<script lang="ts">
	import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';
	import type { ChartProps } from 'flowbite-svelte/dist/charts/Chart.svelte';
	import { Button, Chart } from 'flowbite-svelte';
	import { generateTotalTrendConfig } from './helpers/generateTrendConfig';

	export let href: string;
	export let item: JournalSummaryType & { id: string };
	export let format: currencyFormatType = 'USD';

	$: formatter = getCurrencyFormatter(format);
	$: chartConfig = generateTotalTrendConfig({ data: item.monthlySummary, formatter });
</script>

{item.count}
<Chart {...chartConfig} />
<Button {href}>Journals</Button>
