<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";

  import { page } from "$app/state";

  import CurrencyInputForm from "$lib/components/CurrencyInputForm.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import DateInputForm from "$lib/components/DateInputForm.svelte";
  import ErrorText from "$lib/components/ErrorText.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import PreviousUrlInput from "$lib/components/PreviousURLInput.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import TextInputForm from "$lib/components/TextInputForm.svelte";
  import { pageInfo } from "$lib/routes";

  import CreateTransactionLabelsForm from "./CreateTransactionLabelsForm.svelte";
  import CreateTransactionLinksForm from "./CreateTransactionLinksForm.svelte";

  const { data } = $props();

  const form = superForm(data.form);

  const urlInfo = pageInfo("/(loggedIn)/journals/create", () => page);
  const enhance = $derived(form.enhance);
  const message = $derived(form.message);
  const formData = $derived(form.form);
  const testData = $derived(form.tainted);
</script>

<CustomHeader pageTitle="Create Transaction" />

<PageLayout title="Create Transaction" size="lg">
  <RawDataModal
    dev={data.dev}
    data={urlInfo.current.searchParams}
    buttonText="Current Search Params"
  />
  <RawDataModal
    dev={data.dev}
    data={{ form: $formData, tainted: $testData, formOriginal: data.form }}
    buttonText="Form Data"
  />
  <form method="POST" use:enhance class="grid grid-cols-1 gap-2 md:grid-cols-2">
    <PreviousUrlInput name="prevPage" />
    <input
      type="hidden"
      name="filter"
      value={JSON.stringify(urlInfo.current.searchParams)}
    />
    <input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />
    <TextInputForm title="Description" {form} field="description" />
    <DateInputForm title="Date" {form} field="date" />
    <CurrencyInputForm title="Amount" {form} field="amount" />
    <CreateTransactionLinksForm {form} />
    <CreateTransactionLabelsForm {form} />
    <Button class="mt-4 md:col-span-2" type="submit">Create Transaction</Button>
    <Button class="mt-4 md:col-span-2" onclick={() => form.reset()}
      >Reset</Button
    >
    <ErrorText message={$message} />
  </form>
</PageLayout>
