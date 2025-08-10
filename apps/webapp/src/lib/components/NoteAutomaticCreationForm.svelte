<script lang="ts">
  import { Button, P } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  import type { JournalFilterSchemaType } from "@totallator/shared";
  import {
    createNoteJournalSchema,
    type CreateNoteJournalSchemaInputType,
  } from "@totallator/shared";
  import { formatDate } from "@totallator/shared";
  import type { CreateFileNoteRelationshipSchemaType } from "@totallator/shared";

  import { userDateFormat } from "$lib/stores/userInfoStore";

  import ActionButton from "./ActionButton.svelte";
  import CheckboxInputForm from "./CheckboxInputForm.svelte";
  import TextInputForm from "./TextInputForm.svelte";

  let {
    filter,
    target,
    defaultTitle,
  }: {
    filter: JournalFilterSchemaType;
    target: CreateFileNoteRelationshipSchemaType;
    defaultTitle?: string;
  } = $props();

  const form = superForm<CreateNoteJournalSchemaInputType>(
    {
      title:
        defaultTitle || `Data at ${formatDate(new Date(), $userDateFormat)}`,
      includeCount: true,
      includeSum: true,
      includeDateRange: true,
      filter,
      ...target,
    },
    {
      validators: zod4Client(createNoteJournalSchema),
      dataType: "json",
    },
  );

  const enhance = $derived(form.enhance);
  const loading = $derived(form.submitting);
</script>

<form
  method="post"
  action="?/addNoteJournalFilter"
  use:enhance
  class="flex w-full flex-col items-stretch gap-2"
>
  <input type="hidden" value={JSON.stringify(filter)} id="filter" />
  <TextInputForm {form} field="title" title="Title" />
  <P weight="bold">Dates</P>
  <div class="flex flex-row flex-wrap items-center gap-2">
    <CheckboxInputForm {form} field="includeDate" displayText="Current Date" />
    <CheckboxInputForm
      {form}
      field="includeDateRange"
      displayText="Date Range"
    />
    <CheckboxInputForm
      {form}
      field="includeEarliest"
      displayText="Earliest Journal"
    />
    <CheckboxInputForm
      {form}
      field="includeLatest"
      displayText="Latest Journal"
    />
  </div>

  <P weight="bold">Sum Of Journals</P>
  <div class="flex flex-row flex-wrap items-center gap-2">
    <CheckboxInputForm {form} field="includeSum" displayText="All" />
    <CheckboxInputForm
      {form}
      field="includeSumPositive"
      displayText="Positive"
    />
    <CheckboxInputForm
      {form}
      field="includeSumNegative"
      displayText="Negative"
    />
    <CheckboxInputForm
      {form}
      field="includeSumPositiveNoTransfer"
      displayText="Positive (Excl. Transfers)"
    />
    <CheckboxInputForm
      {form}
      field="includeSumNegativeNoTransfer"
      displayText="Negative (Excl. Transfers)"
    />
  </div>

  <P weight="bold">Count Of Journals</P>
  <div class="flex flex-row flex-wrap items-center gap-2">
    <CheckboxInputForm {form} field="includeCount" displayText="All" />
    <CheckboxInputForm
      {form}
      field="includeCountPositive"
      displayText="Positive"
    />
    <CheckboxInputForm
      {form}
      field="includeCountNegative"
      displayText="Negative"
    />
    <CheckboxInputForm
      {form}
      field="includeCountPositiveNoTransfer"
      displayText="Positive (Excl. Transfers)"
    />
    <CheckboxInputForm
      {form}
      field="includeCountNegativeNoTransfer"
      displayText="Negative (Excl. Transfers)"
    />
  </div>

  <div class="flex items-center justify-between">
    <ActionButton
      class="rounded-lg"
      type="submit"
      message="Create Note"
      loadingMessage="Creating..."
      loading={$loading}
    />
    <Button class="rounded-lg" color="alternative">Cancel</Button>
  </div>
</form>
