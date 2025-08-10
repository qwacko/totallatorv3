<script lang="ts">
  import { Checkbox } from "flowbite-svelte";

  let {
    id,
    selectedIds = $bindable(),
  }: {
    id: string | undefined;
    selectedIds: string[];
  } = $props();

  const toggle = () => {
    if (!id) return;
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((i) => i !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  };
</script>

{#if id}
  <Checkbox checked={selectedIds.includes(id)} onclick={toggle} />
{/if}
