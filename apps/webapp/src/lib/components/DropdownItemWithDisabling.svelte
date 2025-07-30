<script lang="ts">
  import { DropdownItem, type DropdownItemProps } from "flowbite-svelte";

  let {
    disabled,
    children,
    ...props
  }: DropdownItemProps & { disabled?: boolean } = $props();
</script>

<DropdownItem {...props}>
  {#if children}
    {@render children()}
  {/if}
</DropdownItem>
