<script lang="ts">
	const {
		text = '',
		searchText = '',
		highlight = true
	}: { text?: string; searchText?: string | null | undefined; highlight?: boolean } = $props();

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
