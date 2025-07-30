<script lang="ts">
  import { Checkbox, type CheckboxProps, Label } from "flowbite-svelte";

  import ErrorText from "./ErrorText.svelte";

  let {
    errorMessage,
    title = undefined,
    displayText = undefined,
    name,
    required = undefined,
    value = $bindable(),
    ...restProps
  }: {
    errorMessage: string | string[] | null | undefined;
    title?: string | null | undefined;
    displayText?: string | null | undefined;
    name: string;
    required?: boolean | undefined | null;
    value: boolean | undefined;
  } & Omit<CheckboxProps, "checked" | "name" | "required"> = $props();
</script>

<Label class="space-y-2">
  {#if title}
    <span class="flex flex-row gap-1">
      <div>
        {title}
      </div>
      <div>
        {#if required}
          *{/if}
      </div>
    </span>
  {/if}
  <Checkbox
    checked={value}
    {...restProps}
    {name}
    required={required || undefined}
    onchange={() => (value = !value)}
  >
    {displayText ? displayText : ""}
  </Checkbox>
  <ErrorText message={errorMessage} />
</Label>
