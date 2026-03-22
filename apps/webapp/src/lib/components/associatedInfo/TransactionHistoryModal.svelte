<script lang="ts">
	import { Modal } from 'flowbite-svelte';

	import TransactionHistoryTab from './TransactionHistoryTab.svelte';

	const {
		open,
		setOpen,
		transactionId
	}: {
		open: boolean;
		setOpen: (open: boolean) => void;
		transactionId: string;
	} = $props();
</script>

<Modal
	title="Change History"
	{open}
	onclose={() => {
		setOpen(false);
	}}
	outsideclose
>
	<TransactionHistoryTab {transactionId} />
</Modal>
