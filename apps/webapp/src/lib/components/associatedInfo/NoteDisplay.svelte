<script lang="ts">
  import { Badge, Button } from "flowbite-svelte";

  import type { AssociatedInfoDataType } from "@totallator/business-logic";

  import { enhance } from "$app/forms";

  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";

  const { note }: { note: AssociatedInfoDataType["notes"][number] } = $props();
</script>

<div class="flex flex-col gap-2">
  <div class="flex flex-row items-center gap-2">
    <form method="post" action="?/deleteNote" use:enhance>
      <input type="hidden" name="noteId" value={note.id} />
      <Button type="submit" outline color="red" class="border-1 rounded-lg p-1">
        <DeleteIcon />
      </Button>
    </form>
    <Badge color={note.type === "info" ? "green" : "red"}>
      {note.type === "info" ? "Info" : "Reminder"}
    </Badge>

    <div class="whitespace-pre">{note.note}</div>
  </div>
</div>
