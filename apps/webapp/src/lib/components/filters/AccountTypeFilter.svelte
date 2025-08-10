<script lang="ts">
  import { Button, ButtonGroup } from "flowbite-svelte";

  import type { AccountTypeEnumType } from "@totallator/shared";

  let {
    accountTypes = $bindable(),
  }: { accountTypes: AccountTypeEnumType[] | undefined } = $props();

  const assetExists = $derived(accountTypes?.includes("asset"));
  const liabilityExists = $derived(accountTypes?.includes("liability"));
  const incomeExists = $derived(accountTypes?.includes("income"));
  const expenseExists = $derived(accountTypes?.includes("expense"));

  const toggleItem = (item: AccountTypeEnumType) => {
    if (!accountTypes) {
      accountTypes = [item];
    } else {
      const targetExists =
        (assetExists && item === "asset") ||
        (liabilityExists && item === "liability") ||
        (incomeExists && item === "income") ||
        (expenseExists && item === "expense");

      if (targetExists) {
        accountTypes = accountTypes.filter(
          (currentType) => currentType !== item,
        );
      } else {
        accountTypes = [...accountTypes, item];
      }
    }
  };

  const buttonList = $derived([
    { exists: assetExists, title: "Asset", toggle: () => toggleItem("asset") },
    {
      exists: liabilityExists,
      title: "Liability",
      toggle: () => toggleItem("liability"),
    },
    {
      exists: incomeExists,
      title: "Income",
      toggle: () => toggleItem("income"),
    },
    {
      exists: expenseExists,
      title: "Expense",
      toggle: () => toggleItem("expense"),
    },
  ]);
</script>

<div class="flex flex-col gap-2">
  <div class="text-primary-900 flex text-sm font-semibold">Account Type</div>
  <ButtonGroup>
    {#each buttonList as currentButton}
      <Button
        outline={currentButton.exists !== true}
        color="primary"
        onclick={currentButton.toggle}
        class="flex grow basis-0"
      >
        {currentButton.title}
      </Button>
    {/each}
    <Button
      outline={Boolean(accountTypes)}
      color="primary"
      onclick={() => (accountTypes = undefined)}
      class="flex grow basis-0"
    >
      Clear
    </Button>
  </ButtonGroup>
</div>
