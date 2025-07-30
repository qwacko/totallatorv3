<script lang="ts">
  import { ButtonGroup, type ButtonProps } from "flowbite-svelte";

  import { enhance } from "$app/forms";

  import ActionButton from "$lib/components/ActionButton.svelte";
  import { customEnhance } from "$lib/helpers/customEnhance";

  type ButtonColorType = ButtonProps["color"];

  let {
    loading = $bindable(false),
    action,
    currentValue,
    onTitle = "On",
    offTitle = "Off",
    color = "primary",
  }: {
    loading?: boolean;
    action: string;
    currentValue: boolean;
    onTitle?: string;
    offTitle?: string;
    color?: ButtonColorType;
  } = $props();
</script>

<form
  method="post"
  {action}
  use:enhance={customEnhance({
    updateLoading: (newLoading) => (loading = newLoading),
  })}
  class="flex self-center"
>
  <ButtonGroup>
    <ActionButton
      {color}
      type="submit"
      message={onTitle}
      {loading}
      outline={currentValue === false}
      disabled={currentValue === true}
    />
    <ActionButton
      {color}
      type="submit"
      message={offTitle}
      {loading}
      outline={currentValue === true}
      disabled={currentValue === false}
    />
  </ButtonGroup>
</form>
