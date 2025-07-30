<script lang="ts">
  import { Button, Heading } from "flowbite-svelte";

  import { enhance } from "$app/forms";

  const {
    title,
    currentCount,
    deletableCount,
    createAction,
    deleteAction,
    includeHigher = false,
  }: {
    title: string;
    currentCount: number;
    deletableCount: number;
    createAction: string;
    deleteAction: string;
    includeHigher?: boolean;
  } = $props();

  const creationOptions = [
    { title: "+ 10", count: 10 },
    { title: "+ 40", count: 40 },
    { title: "+ 100", count: 100 },
    ...(includeHigher
      ? [
          { title: "+ 500", count: 500 },
          { title: "+ 1000", count: 1000 },
          { title: "+ 5000", count: 5000 },
          { title: "+ 10000", count: 10000 },
        ]
      : []),
  ];
</script>

<div class="flex flex-col gap-2">
  <Heading tag="h3">{title}</Heading>
  <div class="flex">
    Currently : {currentCount}
    {title} Exist - {deletableCount} can be deleted
  </div>
  <div class="flex flex-row gap-2">
    {#each creationOptions as currentOption}
      <form class="flex" method="POST" action={createAction} use:enhance>
        <input type="hidden" name="count" value={currentOption.count} />
        <Button type="submit" outline>{currentOption.title}</Button>
      </form>
    {/each}
    <form class="flex" method="POST" action={deleteAction} use:enhance>
      <Button type="submit" outline color="red">
        Delete {deletableCount} Unused {title}
      </Button>
    </form>
  </div>
</div>
