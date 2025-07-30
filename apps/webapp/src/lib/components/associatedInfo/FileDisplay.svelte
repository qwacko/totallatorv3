<script lang="ts">
  import { Button, P } from "flowbite-svelte";

  import type { AssociatedInfoDataType } from "@totallator/business-logic";

  import { enhance } from "$app/forms";

  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import { urlGenerator } from "$lib/routes";

  import FileThumbnail from "../FileThumbnail.svelte";
  import DownloadIcon from "../icons/DownloadIcon.svelte";

  const {
    file,
    showPlaceholder = true,
  }: {
    file: AssociatedInfoDataType["files"][number];
    associatedInfo: AssociatedInfoDataType;
    showPlaceholder?: boolean;
  } = $props();

  const humanSize = $derived.by(() => {
    if (file.size < 1024) return `${file.size} bytes`;
    if (file.size < 1048576) return `${(file.size / 1024).toFixed(0)} KB`;
    if (file.size < 1073741824) return `${(file.size / 1048576).toFixed(2)} MB`;
    return `${(file.size / 1073741824).toFixed(2)} GB`;
  });
</script>

<div class="flex flex-col gap-2">
  <FileThumbnail item={file} {showPlaceholder} size="md" />
  <div class="flex flex-row items-center gap-2">
    <P weight="light" size="sm">
      {humanSize}
    </P>
    <div class="flex grow"></div>
    <Button
      href={urlGenerator({
        address: "/(loggedIn)/files/[id]/[filename]",
        paramsValue: { id: file.id, filename: file.originalFilename },
      }).url}
      color="blue"
      class="rounded-lg border p-1"
      outline
    >
      <DownloadIcon />
    </Button>
    <form method="post" action="?/deleteFile" use:enhance>
      <input type="hidden" name="fileId" value={file.id} />
      <Button type="submit" outline color="red" class="rounded-lg border p-1">
        <DeleteIcon />
      </Button>
    </form>
  </div>
</div>
