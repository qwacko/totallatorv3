<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Badge,
    Button,
    Card,
  } from "flowbite-svelte";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import ArrowLeftIcon from "$lib/components/icons/ArrowLeftIcon.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import SmartJsonViewer from "$lib/components/SmartJsonViewer.svelte";

  const { data } = $props();
  const { log } = data;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    return status === "SUCCESS" ? "green" : "red";
  };
</script>

<CustomHeader
  pageTitle="LLM Log Detail"
  pageNumber={undefined}
  numPages={undefined}
/>

<PageLayout title="LLM Log Detail">
  {#snippet slotRight()}
    <Button href="/llm/logs" color="light" outline>
      <ArrowLeftIcon height={16} width={16} class="me-2" />
      Back to Logs
    </Button>
  {/snippet}

  <!-- Overview Section -->
  <Card size="xl">
    <h2 class="mb-4 text-xl font-semibold">Overview</h2>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <h3 class="mb-1 font-medium text-gray-700 dark:text-gray-300">
          Timestamp
        </h3>
        <p class="text-sm">{formatTimestamp(log.timestamp)}</p>
      </div>
      <div>
        <h3 class="mb-1 font-medium text-gray-700 dark:text-gray-300">
          Status
        </h3>
        <Badge color={getStatusColor(log.status)}>
          {log.status}
        </Badge>
      </div>
      <div>
        <h3 class="mb-1 font-medium text-gray-700 dark:text-gray-300">
          Duration
        </h3>
        <p class="text-sm">{formatDuration(log.durationMs)}</p>
      </div>
      <div>
        <h3 class="mb-1 font-medium text-gray-700 dark:text-gray-300">
          LLM Setting
        </h3>
        <p class="text-sm">{log.llmSettingsTitle || "Unknown"}</p>
      </div>
      <div>
        <h3 class="mb-1 font-medium text-gray-700 dark:text-gray-300">
          API URL
        </h3>
        <p class="break-all text-sm">{log.llmSettingsApiUrl || "Unknown"}</p>
      </div>
      {#if log.relatedJournalId}
        <div>
          <h3 class="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Related Journal
          </h3>
          <Button
            href="/journals?id={log.relatedJournalId}"
            size="xs"
            color="blue"
          >
            View Journal Entry
          </Button>
        </div>
      {/if}
    </div>
  </Card>

  <!-- Data Section with Accordion -->
  <Card size="xl">
    <h2 class="mb-4 text-xl font-semibold">Request & Response Data</h2>
    <Accordion>
      <AccordionItem>
        {#snippet header()}<span class="text-lg font-medium"
            >Request Payload</span
          >{/snippet}
        <div class="p-4">
          <div
            class="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <SmartJsonViewer data={log.requestPayload} defaultExpanded={true} />
          </div>
        </div>
      </AccordionItem>

      <AccordionItem>
        {#snippet header()}<span class="text-lg font-medium"
            >Response Payload</span
          >{/snippet}
        <div class="p-4">
          <div
            class="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <SmartJsonViewer
              data={log.responsePayload}
              defaultExpanded={true}
            />
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  </Card>
</PageLayout>
