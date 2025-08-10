<script lang="ts">
  import { Input, type InputProps, Label } from "flowbite-svelte";

  import ErrorText from "./ErrorText.svelte";

  let {
    errorMessage,
    title,
    name,
    required,
    value = $bindable(),
    wrapperClass,
    tainted,
    highlightTainted,
    class: className = "",
    ...restProps
  }: {
    errorMessage: string | string[] | null | undefined;
    title: string | null;
    name: string;
    required?: boolean | undefined | null;
    value: string | undefined;
    wrapperClass?: string;
    tainted?: boolean;
    highlightTainted?: boolean;
    class?: string;
  } & Omit<
    InputProps<string>,
    "value" | "name" | "required" | "children"
  > = $props();
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
  {#if title}
    <Label for={name} class="w-full space-y-2">
      <span class="flex flex-row gap-1">
        <div>
          {title}
        </div>
        <div>
          {#if required}*{/if}
        </div>
      </span>
    </Label>
  {/if}
  <Input
    bind:value
    {...restProps}
    {name}
    {required}
    class="{className} {highlightTainted && tainted ? 'ring-2' : ''} "
  />
  <ErrorText message={errorMessage} />
</div>
