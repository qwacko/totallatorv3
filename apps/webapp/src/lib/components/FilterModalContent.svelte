<script
  lang="ts"
  generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
  import { Accordion, AccordionItem, Button, Input } from "flowbite-svelte";
  import { untrack } from "svelte";

  import type {
    JournalFilterSchemaType,
    JournalFilterSchemaWithoutPaginationType,
  } from "@totallator/shared";

  import AccountFilter from "./filters/AccountFilter.svelte";
  import BillFilter from "./filters/BillFilter.svelte";
  import BudgetFilter from "./filters/BudgetFilter.svelte";
  import CategoryFilter from "./filters/CategoryFilter.svelte";
  import JournalEntryFilter from "./filters/JournalEntryFilter.svelte";
  import LabelFilter from "./filters/LabelFilter.svelte";
  import PayeeFilter from "./filters/PayeeFilter.svelte";
  import TagFilter from "./filters/TagFilter.svelte";

  let {
    currentFilter,
    urlFromFilter,
    hideSubmit = false,
    url = $bindable(""),
    activeFilter = $bindable(currentFilter),
    hideDates = false,
  }: {
    currentFilter: F;
    urlFromFilter?: (filter: F) => string;
    hideSubmit?: boolean;
    url?: string;
    activeFilter?: F;
    hideDates?: boolean;
  } = $props();

  $effect(() => {
    activeFilter = currentFilter;
  });
  $effect(() => {
    url = urlFromFilter ? urlFromFilter(activeFilter) : "";

    //Added to make 'url" be used, otherwise there is an error'
    if (false) {
      console.log(
        "URL: ",
        untrack(() => url),
      );
    }
  });
</script>

<div class="flex flex-col gap-6">
  <Input
    bind:value={activeFilter.textFilter}
    name="textFilter"
    title="Text Filter"
  />
  <Accordion>
    <AccordionItem>
      {#snippet header()}Journal Entry{/snippet}
      <JournalEntryFilter bind:activeFilter {hideDates} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Account{/snippet}
      <AccountFilter bind:filter={activeFilter.account} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Exclude Account{/snippet}
      <AccountFilter bind:filter={activeFilter.excludeAccount} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Payee{/snippet}
      <PayeeFilter bind:filter={activeFilter.payee} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Exclude Payee{/snippet}
      <PayeeFilter bind:filter={activeFilter.excludePayee} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Bill{/snippet}
      <BillFilter bind:filter={activeFilter.bill} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Exclude Bill{/snippet}
      <BillFilter bind:filter={activeFilter.excludeBill} />
    </AccordionItem><AccordionItem>
      {#snippet header()}Exclude Budget{/snippet}
      <BudgetFilter bind:filter={activeFilter.excludeBudget} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Budget{/snippet}
      <BudgetFilter bind:filter={activeFilter.budget} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Category{/snippet}
      <CategoryFilter bind:filter={activeFilter.category} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Exclude Category{/snippet}
      <CategoryFilter bind:filter={activeFilter.excludeCategory} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Tag{/snippet}
      <TagFilter bind:filter={activeFilter.tag} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Exclude Tag{/snippet}
      <TagFilter bind:filter={activeFilter.excludeTag} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Label{/snippet}
      <LabelFilter bind:filter={activeFilter.label} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Exclude Label{/snippet}
      <LabelFilter bind:filter={activeFilter.excludeLabel} />
    </AccordionItem>
    <AccordionItem>
      {#snippet header()}Current Filter Raw{/snippet}
      <pre>{JSON.stringify(activeFilter, null, 2)}</pre>
    </AccordionItem>
  </Accordion>
  {#if !hideSubmit && urlFromFilter}
    <Button href={urlFromFilter(activeFilter)}>Apply</Button>
  {/if}
</div>
