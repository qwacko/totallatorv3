<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
  import type { ComponentProps } from "svelte";
  import type { Writable } from "svelte/store";
  import type { FormPathLeaves } from "sveltekit-superforms";
  import { formFieldProxy, type SuperForm } from "sveltekit-superforms";

  import NumberInput from "./NumberInput.svelte";

  type NumberInputProps = ComponentProps<typeof NumberInput>;

  const {
    form,
    field,
    wrapperClass,
    title,
    highlightTainted = true,
    numberDecimals = 0,
    class: className = "",
    ...restProps
  }: {
    form: SuperForm<T, unknown>;
    field: FormPathLeaves<T>;
    wrapperClass?: string;
    title: string | null;
    highlightTainted?: boolean;
    numberDecimals?: 0 | 1 | 2;
    class?: string;
  } & Omit<
    NumberInputProps,
    | "title"
    | "name"
    | "numberDecimals"
    | "value"
    | "errorMessage"
    | "tainted"
    | "highlightTainted"
    | "form"
    | "field"
    | "wrapperClass"
    | "class"
  > = $props();

  const { value, errors, constraints, tainted } = formFieldProxy(form, field);

  const stringValue = $derived(value as Writable<number>);
</script>

<NumberInput
  {title}
  name={field}
  {numberDecimals}
  bind:value={$stringValue}
  errorMessage={$errors}
  tainted={$tainted}
  {highlightTainted}
  aria-invalid={$errors ? "true" : undefined}
  class={className}
  {wrapperClass}
  {...$constraints}
  {...restProps}
/>
