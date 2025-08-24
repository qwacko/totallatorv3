<script lang="ts">
	const {
		filterText = undefined,
		pageTitle,
		pageNumber = undefined,
		numPages = undefined
	}: {
		filterText?: string[] | string | undefined;
		pageTitle: string;
		pageNumber?: number | undefined;
		numPages?: number | undefined;
	} = $props();

	const filterTextJoined = $derived(
		filterText ? (Array.isArray(filterText) ? filterText.join(' and ') : filterText) : undefined
	);
</script>

<svelte:head>
	<title>
		{pageTitle}{pageNumber !== undefined && numPages !== undefined
			? ` (${pageNumber + 1}/${numPages})`
			: pageNumber !== undefined
				? ` Page ${pageNumber}`
				: ''}{filterTextJoined && filterTextJoined !== '' ? ` : ${filterTextJoined}` : ''}
	</title>
</svelte:head>
