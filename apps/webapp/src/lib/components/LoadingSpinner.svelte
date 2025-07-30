<script lang="ts">
  import { Badge, Spinner } from "flowbite-svelte";

  const { loadingText = "Loading..." }: { loadingText?: string } = $props();
</script>

<Badge class="flex flex-row gap-2" color="blue">
  <Spinner size="8" class="p-1" />{loadingText}
</Badge>
