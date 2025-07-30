<script lang="ts" generics="Keys extends string">
  import { Button, DropdownItem, Input } from "flowbite-svelte";

  let {
    params = $bindable(),
    key,
  }: { params: Partial<Record<Keys, string>> | undefined; key: Keys } =
    $props();

  const enableParams = () => {
    if (!params) {
      params = {} as Record<Keys, string>;
    }
  };
</script>

<DropdownItem>
  {#if params}
    <Input type="text" bind:value={params[key]} placeholder="Filter By Title" />
  {:else}
    <Button outline onclick={enableParams}>Filter</Button>
  {/if}
</DropdownItem>
