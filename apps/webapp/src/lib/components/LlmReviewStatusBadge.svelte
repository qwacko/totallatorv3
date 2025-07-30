<script lang="ts">
  import { Badge } from "flowbite-svelte";

  import type { LlmReviewStatusEnumType } from "@totallator/shared";
  import { llmReviewStatusEnumTitles } from "@totallator/shared";
  import type { JournalFilterSchemaType } from "@totallator/shared";

  import { urlGenerator } from "$lib/routes";

  const {
    status,
    currentFilter,
  }: {
    status: LlmReviewStatusEnumType;
    currentFilter: JournalFilterSchemaType;
  } = $props();

  const statusColors = {
    not_required: "gray",
    required: "yellow",
    complete: "green",
    error: "red",
  } as const;

  const filterUrl = urlGenerator({
    address: "/(loggedIn)/journals",
    searchParamsValue: {
      ...currentFilter,
      llmReviewStatus: [status],
    },
  });
</script>

<Badge
  color={statusColors[status]}
  href={filterUrl.url}
  class="cursor-pointer hover:opacity-80"
>
  {llmReviewStatusEnumTitles[status]}
</Badge>
