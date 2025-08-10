<script lang="ts">
  import type { SuperForm } from "sveltekit-superforms";

  import type { CloneJournalUpdateSchemaType } from "@totallator/shared";

  import CurrencyInputForm from "$lib/components/CurrencyInputForm.svelte";
  import DateInputForm from "$lib/components/DateInputForm.svelte";
  import TextInputForm from "$lib/components/TextInputForm.svelte";

  const { form }: { form: SuperForm<CloneJournalUpdateSchemaType> } = $props();
</script>

<TextInputForm title="Description" {form} field="description" />
<DateInputForm title="Date" {form} field="date" />
<CurrencyInputForm title="To Amount" {form} field="toAmount" />
