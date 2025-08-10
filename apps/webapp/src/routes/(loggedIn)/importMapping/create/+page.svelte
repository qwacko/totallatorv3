<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  import { importMappingDetailSchema } from "@totallator/shared";

  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";

  import ImportMappingForm from "./ImportMappingForm.svelte";

  const { data } = $props();

  const form = superForm(data.form);
  const detailForm = superForm(data.detailForm, {
    validators: zod4Client(importMappingDetailSchema),
    validationMethod: "oninput",
  });
</script>

<PageLayout title="Create Import Mapping">
  <RawDataModal {data} dev={data.dev} />
  <ImportMappingForm
    {form}
    {detailForm}
    submitButtonText="Create Import Mapping"
  />
</PageLayout>
