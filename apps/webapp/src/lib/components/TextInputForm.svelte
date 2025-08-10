<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
  import { Button } from "flowbite-svelte";
  import { type ComponentProps, untrack } from "svelte";
  import type { Writable } from "svelte/store";
  import type { FormPathLeaves } from "sveltekit-superforms";
  import { formFieldProxy, type SuperForm } from "sveltekit-superforms";

  import CancelIcon from "./icons/CancelIcon.svelte";
  import TextInput from "./TextInput.svelte";

  type TextInputProps = ComponentProps<typeof TextInput>;

  const {
    form,
    field,
    wrapperClass,
    outerWrapperClass,
    title,
    highlightTainted = true,
    clearable = false,
    clearField = field,
    class: className = "",
    ...restProps
  }: {
    form: SuperForm<T, unknown>;
    field: FormPathLeaves<T>;
    wrapperClass?: string;
    outerWrapperClass?: string;
    title: string | null;
    highlightTainted?: boolean;
    clearable?: boolean;
    clearField?: FormPathLeaves<T>;
    class?: string;
  } & Omit<
    TextInputProps,
    | "title"
    | "name"
    | "value"
    | "errorMessage"
    | "tainted"
    | "highlightTainted"
    | "wrapperClass"
    | "form"
    | "field"
  > = $props();

  const { value, errors, constraints, tainted } = formFieldProxy(form, field);
  const { value: clearValueOriginal } = formFieldProxy(form, clearField);

  const stringValue = $derived(value as Writable<string>);
  const clearValue = $derived(
    clearValueOriginal as Writable<boolean | undefined>,
  );

  const updateStringValue = (newValue: string) => {
    if (clearable && newValue !== "" && $clearValue) {
      $clearValue = false;
    }
  };
  const updateClearValue = () => {
    if (clearable) {
      $clearValue = true;
      $stringValue = "";
    }
  };

  $effect(() => {
    clearable && untrack(() => updateStringValue)($stringValue);
  });
</script>

<div
  class="flex w-full flex-row gap-2 {outerWrapperClass
    ? outerWrapperClass
    : ''}"
>
  <TextInput
    {title}
    name={field}
    bind:value={$stringValue}
    errorMessage={$errors}
    tainted={$tainted}
    {highlightTainted}
    aria-invalid={$errors ? "true" : undefined}
    class={className}
    wrapperClass="grow {wrapperClass}"
    {...$constraints}
    {...restProps}
  />
  {#if clearable}
    <Button
      class="flex self-end py-3"
      outline={$clearValue === false}
      onclick={updateClearValue}
    >
      <CancelIcon />
    </Button>
    {#if $clearValue}
      <input type="hidden" name={clearField} value="true" />
    {/if}
  {/if}
</div>
