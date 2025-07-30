<script lang="ts">
  import { Button, type ButtonProps, Modal } from "flowbite-svelte";
  import CodeIcon from "~icons/mdi/xml";

  import MoreIcon from "./icons/MoreIcon.svelte";

  type ButtonColorType = ButtonProps["color"];

  const {
    data,
    title = "Raw Data",
    dev = false,
    buttonText,
    color,
    outline = false,
    icon = "code",
  }: {
    data: unknown;
    title?: string;
    dev?: boolean;
    buttonText?: string;
    color?: ButtonColorType;
    outline?: boolean;
    icon?: "more" | "code";
  } = $props();

  let open = $state(false);
</script>

{#if dev}
  <Button
    {color}
    {outline}
    onclick={() => (open = true)}
    class="flex flex-row content-center gap-2 p-2"
  >
    {#if icon === "code"}
      <CodeIcon />
    {:else if icon === "more"}
      <MoreIcon />
    {/if}
    {#if buttonText}
      {buttonText}
    {/if}
  </Button>
  <Modal {title} bind:open autoclose outsideclose>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </Modal>
{/if}
