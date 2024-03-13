<script lang="ts">
	export let filterText: string[] | string | undefined = undefined;
	export let pageTitle: string;
	export let pageNumber: number | undefined = undefined;
	export let numPages: number | undefined = undefined;

	$: filterTextJoined = filterText
		? Array.isArray(filterText)
			? filterText.join(' and ')
			: filterText
		: undefined;
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
