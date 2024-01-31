<script lang="ts">
	export let text = '';
	export let searchText: string | null | undefined = '';
	export let highlight = true;

	const regexEscape = (s: string) => {
		return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
	};

	function highlightText(fullText: string, search: string | null | undefined) {
		if (!search) return fullText;

		const regex = new RegExp(`(${regexEscape(search)})`, 'gi');
		return fullText.replace(regex, '<span class="bg-yellow-300">$1</span>');
	}
</script>

{#if highlight}
	{@html highlightText(text, searchText)}
{:else}
	{text}
{/if}
