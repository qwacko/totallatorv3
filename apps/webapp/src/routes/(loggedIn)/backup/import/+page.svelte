<script lang="ts">
  import { Button, Fileupload } from "flowbite-svelte";

  import { enhance } from "$app/forms";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
</script>

<CustomHeader pageTitle="Import Backup" />

<PageLayout title="Import Backup">
  <form
    action="?/import"
    method="post"
    enctype="multipart/form-data"
    use:enhance
    class="flex flex-row gap-2"
  >
    <Fileupload name="backupFile" />
    <Button type="submit" outline color="green">Import</Button>
  </form>
</PageLayout>
