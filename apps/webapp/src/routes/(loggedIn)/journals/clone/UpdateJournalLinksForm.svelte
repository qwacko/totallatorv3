<script lang="ts">
  import type { SuperForm } from "sveltekit-superforms";

  import type { UpdateJournalSchemaType } from "@totallator/shared";

  import ComboSelectForm from "$lib/components/ComboSelectForm.svelte";
  import {
    accountDropdownData,
    billDropdownData,
    budgetDropdownData,
    categoryDropdownData,
    tagDropdownData,
  } from "$lib/stores/dropdownStores.js";

  const {
    form,
    hideAccount = false,
  }: { form: SuperForm<UpdateJournalSchemaType>; hideAccount?: boolean } =
    $props();

  const formData = $derived(form.form);
</script>

{#if !hideAccount}
  <ComboSelectForm
    {form}
    title="Account"
    items={$accountDropdownData}
    field="accountId"
    placeholder="Select Account..."
    itemToDisplay={(item) => ({ title: item.title, group: item.group })}
    itemToOption={(item) => ({
      label: item.title,
      value: item.id,
      disabled: !item.enabled,
    })}
    createField="accountTitle"
    bind:createValue={$formData.accountTitle}
    createDesc="New Expense"
  />
  <ComboSelectForm
    {form}
    title="Payee"
    items={$accountDropdownData}
    field="otherAccountId"
    placeholder="Select Payee..."
    itemToDisplay={(item) => ({ title: item.title, group: item.group })}
    itemToOption={(item) => ({
      label: item.title,
      value: item.id,
      disabled: !item.enabled,
    })}
    createField="otherAccountTitle"
    bind:createValue={$formData.otherAccountTitle}
    createDesc="New Expense"
  />
{/if}
<ComboSelectForm
  {form}
  title="Tag"
  items={$tagDropdownData}
  field="tagId"
  clearField="tagClear"
  bind:clearValue={$formData.tagClear}
  placeholder="Select Tag..."
  itemToDisplay={(item) => ({ title: item.title, group: item.group })}
  itemToOption={(item) => ({
    label: item.title,
    value: item.id,
    disabled: !item.enabled,
  })}
  createField="tagTitle"
  bind:createValue={$formData.tagTitle}
  createDesc="New Tag"
/>
<ComboSelectForm
  {form}
  title="Category"
  items={$categoryDropdownData}
  field="categoryId"
  clearField="categoryClear"
  bind:clearValue={$formData.categoryClear}
  placeholder="Select Category..."
  itemToDisplay={(item) => ({ title: item.title, group: item.group })}
  itemToOption={(item) => ({
    label: item.title,
    value: item.id,
    disabled: !item.enabled,
  })}
  createField="categoryTitle"
  bind:createValue={$formData.categoryTitle}
  createDesc="New Category"
/>
<ComboSelectForm
  {form}
  title="Bill"
  items={$billDropdownData}
  field="billId"
  clearField="billClear"
  bind:clearValue={$formData.billClear}
  placeholder="Select Bill..."
  itemToDisplay={(item) => ({ title: item.title })}
  itemToOption={(item) => ({
    label: item.title,
    value: item.id,
    disabled: !item.enabled,
  })}
  createField="billTitle"
  bind:createValue={$formData.billTitle}
  createDesc="New Bill"
/>
<ComboSelectForm
  {form}
  title="Budget"
  items={$budgetDropdownData}
  field="budgetId"
  clearField="budgetClear"
  bind:clearValue={$formData.budgetClear}
  placeholder="Select Budget..."
  itemToDisplay={(item) => ({ title: item.title })}
  itemToOption={(item) => ({
    label: item.title,
    value: item.id,
    disabled: !item.enabled,
  })}
  createField="budgetTitle"
  bind:createValue={$formData.budgetTitle}
  createDesc="New Budget"
/>
