<script lang="ts">
  import { Button, Toggle } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";

  import { accountTypeEnumSelection } from "@totallator/shared";
  import { statusEnumSelection } from "@totallator/shared";

  import { page } from "$app/state";

  import CheckboxInput from "$lib/components/CheckboxInput.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import DateInputForm from "$lib/components/DateInputForm.svelte";
  import FilterTextDisplay from "$lib/components/FilterTextDisplay.svelte";
  import CancelIcon from "$lib/components/icons/CancelIcon.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import PreviousUrlInput from "$lib/components/PreviousURLInput.svelte";
  import SelectInput from "$lib/components/SelectInput.svelte";
  import TextInputForm from "$lib/components/TextInputForm.svelte";
  import { pageInfo } from "$lib/routes.js";

  const { data } = $props();

  const urlInfo = pageInfo("/(loggedIn)/accounts/bulkEdit", () => page);

  const form = superForm(data.form, {});

  let updateAccountGrouping = $state(false);

  const titleText = $derived(`Update ${data.numberItems} Accounts`);
  const enhance = $derived(form.enhance);
  const formData = $derived(form.form);
  const formErrors = $derived(form.errors);
</script>

<CustomHeader pageTitle={titleText} filterText={data.filterText} />

<PageLayout title={titleText}>
  <FilterTextDisplay text={data.filterText} />
  <form method="post" class="grid grid-cols-1 gap-4 md:grid-cols-2" use:enhance>
    <PreviousUrlInput name="prevPage" />
    <input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />
    <input
      type="hidden"
      name="filter"
      value={JSON.stringify(urlInfo.current.searchParams)}
    />

    {#if $formData.type === "asset" || $formData.type === "liability"}
      <Toggle
        class="col-span-1 md:col-span-2"
        checked={updateAccountGrouping === true}
        onchange={(e) => {
          const currentType = $formData.type;
          updateAccountGrouping = !updateAccountGrouping;
          form.reset();
          $formData.type = currentType;
        }}
      >
        Update Account Grouping
      </Toggle>
    {/if}
    <TextInputForm {form} field="title" title="Title" />
    <div class="flex flex-row gap-2">
      <SelectInput
        items={accountTypeEnumSelection}
        bind:value={$formData.type}
        errorMessage={$formErrors.type}
        name="type"
        title="Type"
        wrapperClass="grow"
      />
      <Button
        type="button"
        class="self-end py-3"
        outline
        disabled={$formData.type === undefined}
        onclick={() => ($formData.type = undefined)}
      >
        <CancelIcon />
      </Button>
    </div>
    <SelectInput
      items={statusEnumSelection}
      bind:value={$formData.status}
      errorMessage={$formErrors.status}
      name="status"
      title="Status"
    />
    {#if $formData.type === "asset" || $formData.type === "liability" || $formData.type === undefined}
      {#if updateAccountGrouping}
        <TextInputForm
          {form}
          field="accountGroupCombined"
          title="Combined Account Grouping"
          clearable
          clearField="accountGroupCombinedClear"
        />
      {:else}
        <TextInputForm
          {form}
          field="accountGroup"
          title="Account Group"
          clearable
          clearField="accountGroupClear"
        />
        <TextInputForm
          {form}
          field="accountGroup2"
          title="Account Group 2"
          clearable
          clearField="accountGroup2Clear"
        />
        <TextInputForm
          {form}
          field="accountGroup3"
          title="Account Group 3"
          clearable
          clearField="accountGroup3Clear"
        />
      {/if}
      <DateInputForm {form} field="startDate" title="Start Date" />
      <DateInputForm {form} field="endDate" title="End Date" />
      <CheckboxInput
        name="isCash"
        bind:value={$formData.isCash}
        title="Is Cash"
        errorMessage=""
      />
      <CheckboxInput
        name="isNetWorth"
        bind:value={$formData.isNetWorth}
        title="Is Net Worth"
        errorMessage=""
      />
    {/if}
    <Button type="submit" class="col-span-1 md:col-span-2">Update</Button>
    <Button
      type="button"
      onclick={() => form.reset()}
      class="col-span-1 md:col-span-2"
    >
      Reset
    </Button>
  </form>
</PageLayout>
