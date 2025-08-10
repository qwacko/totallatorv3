<script lang="ts">
  import { Badge } from "flowbite-svelte";

  import type { AssociatedInfoLinkType } from "@totallator/business-logic";

  import AccountIcon from "$lib/components/icons/AccountIcon.svelte";
  import BillIcon from "$lib/components/icons/BillIcon.svelte";
  import BudgetIcon from "$lib/components/icons/BudgetIcon.svelte";
  import CategoryIcon from "$lib/components/icons/CategoryIcon.svelte";
  import JournalEntryIcon from "$lib/components/icons/JournalEntryIcon.svelte";
  import LabelIcon from "$lib/components/icons/LabelIcon.svelte";
  import TagIcon from "$lib/components/icons/TagIcon.svelte";
  import { urlGenerator } from "$lib/routes";

  const {
    data,
  }: {
    data: AssociatedInfoLinkType;
  } = $props();
</script>

<div class="flex flex-row gap-2">
  {#if data.accountTitle}
    <Badge
      href={data.accountId
        ? urlGenerator({
            address: "/(loggedIn)/accounts",
            searchParamsValue: { id: data.accountId },
          }).url
        : undefined}
    >
      <div class="flex flex-row gap-2">
        <AccountIcon />{data.accountTitle}
      </div>
    </Badge>
  {/if}
  {#if data.labelTitle}
    <Badge
      href={data.labelId
        ? urlGenerator({
            address: "/(loggedIn)/labels",
            searchParamsValue: { id: data.labelId },
          }).url
        : undefined}
    >
      <div class="flex flex-row gap-2">
        <LabelIcon />{data.labelTitle}
      </div>
    </Badge>
  {/if}
  {#if data.billTitle}
    <Badge
      href={data.billId
        ? urlGenerator({
            address: "/(loggedIn)/bills",
            searchParamsValue: { id: data.billId },
          }).url
        : undefined}
    >
      <div class="flex flex-row gap-2">
        <BillIcon />{data.billTitle}
      </div>
    </Badge>
  {/if}
  {#if data.budgetTitle}
    <Badge
      href={data.budgetId
        ? urlGenerator({
            address: "/(loggedIn)/budgets",
            searchParamsValue: { id: data.budgetId },
          }).url
        : undefined}
    >
      <div class="flex flex-row gap-2">
        <BudgetIcon />{data.budgetTitle}
      </div>
    </Badge>
  {/if}
  {#if data.categoryTitle}
    <Badge
      href={data.categoryId
        ? urlGenerator({
            address: "/(loggedIn)/categories",
            searchParamsValue: { id: data.categoryId },
          }).url
        : undefined}
    >
      <div class="flex flex-row gap-2">
        <CategoryIcon />{data.categoryTitle}
      </div>
    </Badge>
  {/if}
  {#if data.tagTitle}
    <Badge
      href={data.tagId
        ? urlGenerator({
            address: "/(loggedIn)/tags",
            searchParamsValue: { id: data.tagId },
          }).url
        : undefined}
    >
      <div class="flex flex-row gap-2">
        <TagIcon />{data.tagTitle}
      </div>
    </Badge>
  {/if}
  {#if data.transaction?.journals && data.transaction.journals.length > 0}
    {#each data.transaction.journals as journal}
      <Badge
        href={data.transactionId
          ? urlGenerator({
              address: "/(loggedIn)/journals",
              searchParamsValue: {
                transactionIdArray: [data.transactionId],
                pageSize: 10,
                page: 0,
                orderBy: [{ field: "date", direction: "desc" }],
              },
            }).url
          : undefined}
      >
        <div class="flex flex-row gap-2">
          <JournalEntryIcon />
          <div class="flex">
            {journal.dateText} - {journal.account.title} - {journal.description}
          </div>
        </div>
      </Badge>
    {/each}
  {/if}
</div>
