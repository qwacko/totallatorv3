<script lang="ts">
  import { type DropdownItemProps, Spinner } from "flowbite-svelte";
  import type { Snippet } from "svelte";

  import { enhance } from "$app/forms";

  import { customEnhance } from "$lib/helpers/customEnhance";
  import { onError, onSuccess } from "$lib/stores/notificationHelpers";

  import DropdownItemWithDisabling from "./DropdownItemWithDisabling.svelte";

  let {
    loading = $bindable(),
    successMessage,
    errorMessage,
    action,
    children,
    slotLoading,
    ...restProps
  }: {
    loading: boolean;
    successMessage?: string;
    errorMessage?: string;
    action: string;
    children?: Snippet;
    slotLoading?: Snippet;
  } & DropdownItemProps = $props();
</script>

<form
  method="post"
  {action}
  use:enhance={customEnhance({
    updateLoading: (newLoading) => {
      loading = newLoading;
    },
    onSuccess: () => {
      if (successMessage) onSuccess(successMessage)();
    },
    onError: () => {
      if (errorMessage) onError(errorMessage)();
    },
    onFailure: () => {
      if (errorMessage) onError(errorMessage)();
    },
  })}
>
  <DropdownItemWithDisabling
  {...restProps}
    disabled={loading}
    type="submit"
    class="flex flex-row gap-2"
  >
    {#if loading}
      {#if slotLoading}
        {@render slotLoading()}
      {:else}
        <Spinner />Loading...
      {/if}
    {:else if children}
      {@render children()}
    {:else}
      Action
    {/if}
  </DropdownItemWithDisabling>
</form>
