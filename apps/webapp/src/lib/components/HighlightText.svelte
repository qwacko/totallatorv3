<script lang="ts">
  import { createSearchRegex } from "$lib/helpers/regexConstants";

  const {
    text = "",
    searchText = "",
    highlight = true,
  }: {
    text?: string;
    searchText?: string | null | undefined;
    highlight?: boolean;
  } = $props();

  function highlightText(fullText: string, search: string | null | undefined) {
    if (!search) return fullText;

    const regex = createSearchRegex(search);
    return fullText.replace(regex, '<span class="bg-yellow-300">$1</span>');
  }
</script>

{#if highlight}
  {@html highlightText(text, searchText)}
{:else}
  {text}
{/if}
