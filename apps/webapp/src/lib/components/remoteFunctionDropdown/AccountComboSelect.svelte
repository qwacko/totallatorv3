<script lang="ts">
	import { accountsQuery, singleAccountQuery } from './accounts.remote';
	import ComboSelectRF from './ComboSelectRF.svelte';

	let selection = $state<undefined | string>(undefined);
</script>

<ComboSelectRF
	itemGetter={accountsQuery}
	placeholder="Test Select Account..."
	singleItemGetter={singleAccountQuery}
	bind:value={selection}
	queryKey="accounts_dropdown"
/>
Selection = {selection}
