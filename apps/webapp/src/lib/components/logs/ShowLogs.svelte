<script lang="ts">
  import {
    Badge,
    PaginationNav,
    Input,
    Card,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyRow,
    TableBodyCell,
    Button,
    ButtonGroup,
  } from "flowbite-svelte";
  import { SearchOutline, RefreshOutline } from "flowbite-svelte-icons";
  import { getLogs } from "./logsDisplay.remote";
  import { useInterval } from "runed";
  import type { LogFilterValidationType } from "../../../../../../packages/logDatabase/dist/validation/logFilterValidation";

  let filter = $state<
    LogFilterValidationType & { limit: number; offset: number }
  >({ limit: 100, offset: 0 });
  let refreshInterval = $state<number>(2000);

  const logs = $derived(await getLogs(filter));
  const currentPage = $derived(Math.floor(filter.offset / filter.limit) + 1);
  const totalPages = $derived(Math.ceil(logs.logCount / filter.limit));
  $effect(() => {
    if (currentPage > totalPages) {
      filter.offset = (totalPages - 1) * filter.limit;
    }
  });
  let updateTime = $state(new Date());

  const interval = useInterval(async () => {
    await getLogs(filter).refresh();
    updateTime = new Date();
  }, () => refreshInterval);

  const refreshNow = async () => {
    await getLogs(filter).refresh();
    updateTime = new Date();
  };

  const toggleItem = (
    key: "domain" | "action" | "contextId" | "code" | "level",
    value: string | undefined,
  ) => {
    if (!value) {
      return;
    }
    const currentValue = filter[key] || [];
    if (currentValue.includes(value as any)) {
      filter[key] = currentValue.filter((item) => item !== value) as any;
    } else {
      filter[key] = [...currentValue, value as any];
    }
  };

  const highlightText = (
    text: string,
    searchTerm: string | undefined,
  ): string => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(
      "(" + searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
      "gi",
    );
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "ERROR":
        return "red";
      case "WARN":
        return "yellow";
      case "INFO":
        return "blue";
      case "DEBUG":
        return "gray";
      case "TRACE":
        return "gray";
      default:
        return "gray";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  };
</script>

<Card class="max-w-none">
  <!-- Header Section -->
  <div class="flex justify-between items-center mb-6">
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Log Viewer
      </h2>
      <Badge color="gray" class="text-xs"
        >Last updated: {formatDate(updateTime)}</Badge
      >
    </div>
    <div class="flex items-center gap-2">
      <Button size="sm" color="alternative" onclick={refreshNow}>
        <RefreshOutline class="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
  </div>

  <!-- Controls Section -->
  <div class="space-y-4 mb-6">
    <!-- Search and Auto-refresh -->
    <div class="flex gap-4 items-end">
      <div class="flex-1">
        <label
          for="search"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Search in logs</label
        >
        <div class="relative">
          <SearchOutline
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <Input
            id="search"
            placeholder="Search log titles and data..."
            bind:value={filter.text}
            class="pl-10"
          />
        </div>
      </div>
      <div>
        <label
          for="auto-refresh"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Auto-refresh</label
        >
        <ButtonGroup id="auto-refresh">
          {#each [0, 0.5, 1, 2, 5, 10] as currentInterval}
            <Button
              size="sm"
              color={currentInterval === refreshInterval / 1000
                ? "blue"
                : "alternative"}
              onclick={() => {
                refreshInterval = currentInterval * 1000;
                interval.pause();
                if (refreshInterval !== 0) {
                  interval.resume();
                }
              }}
            >
              {#if currentInterval === 0}Off{:else}{currentInterval}s{/if}
            </Button>
          {/each}
        </ButtonGroup>
      </div>
    </div>

    <!-- Active Filters -->
    {#if filter.contextId?.length || filter.domain?.length || filter.code?.length || filter.level?.length || filter.action?.length}
      <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Active Filters:
        </h4>
        <div class="flex flex-wrap gap-2">
          {#if filter.contextId}
            {#each filter.contextId as currentContextId}
              <Badge
                color="purple"
                onclick={() => {
                  toggleItem("contextId", currentContextId);
                }}
                class="cursor-pointer hover:bg-purple-200"
              >
                Context: {currentContextId} ×
              </Badge>
            {/each}
          {/if}
          {#if filter.domain}
            {#each filter.domain as currentDomain}
              <Badge
                color="green"
                onclick={() => {
                  toggleItem("domain", currentDomain);
                }}
                class="cursor-pointer hover:bg-green-200"
              >
                Domain: {currentDomain} ×
              </Badge>
            {/each}
          {/if}
          {#if filter.code}
            {#each filter.code as currentCode}
              <Badge
                color="indigo"
                onclick={() => {
                  toggleItem("code", currentCode);
                }}
                class="cursor-pointer hover:bg-indigo-200"
              >
                Code: {currentCode} ×
              </Badge>
            {/each}
          {/if}
          {#if filter.level}
            {#each filter.level as currentLevel}
              <Badge
                color={getLevelColor(currentLevel)}
                onclick={() => {
                  toggleItem("level", currentLevel);
                }}
                class="cursor-pointer"
              >
                Level: {currentLevel} ×
              </Badge>
            {/each}
          {/if}
          {#if filter.action}
            {#each filter.action as currentAction}
              <Badge
                color="blue"
                onclick={() => {
                  toggleItem("action", currentAction);
                }}
                class="cursor-pointer hover:bg-blue-200"
              >
                Action: {currentAction} ×
              </Badge>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Results Info and Pagination -->
  <div class="flex justify-between items-center mb-4">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Showing {Math.min(filter.offset + 1, logs.logCount)}-{Math.min(
        filter.offset + filter.limit,
        logs.logCount,
      )} of {logs.logCount} logs
    </p>
    <PaginationNav
      {currentPage}
      {totalPages}
      onPageChange={(newPage) => {
        filter.offset = (newPage - 1) * filter.limit;
      }}
    />
  </div>

  <!-- Logs Table -->
  <div class="overflow-x-auto">
    <Table hoverable={true} striped={true}>
      <TableHead>
        <TableHeadCell>ID</TableHeadCell>
        <TableHeadCell>Timestamp</TableHeadCell>
        <TableHeadCell>Title</TableHeadCell>
        <TableHeadCell>Context</TableHeadCell>
        <TableHeadCell>Domain</TableHeadCell>
        <TableHeadCell>Code</TableHeadCell>
        <TableHeadCell>Action</TableHeadCell>
        <TableHeadCell>Level</TableHeadCell>
        <TableHeadCell>Data</TableHeadCell>
      </TableHead>
      <TableBody>
        {#each logs.logs as log}
          <TableBodyRow>
            <TableBodyCell class="font-mono text-sm"
              >{(log as any).id}</TableBodyCell
            >
            <TableBodyCell class="font-mono text-sm whitespace-nowrap"
              >{formatDate(log.date)}</TableBodyCell
            >
            <TableBodyCell class="max-w-xs">
              <div class="truncate" title={log.title}>
                {@html highlightText(log.title, filter.text)}
              </div>
            </TableBodyCell>
            <TableBodyCell>
              {#if log.contextId}
                <Badge
                  color="purple"
                  onclick={() => {
                    toggleItem("contextId", log.contextId);
                  }}
                  class="cursor-pointer hover:bg-purple-200"
                >
                  {log.contextId}
                </Badge>
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              {#if log.domain}
                <Badge
                  color="green"
                  onclick={() => {
                    toggleItem("domain", log.domain);
                  }}
                  class="cursor-pointer hover:bg-green-200"
                >
                  {log.domain}
                </Badge>
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              {#if log.code}
                <Badge
                  color="indigo"
                  onclick={() => {
                    toggleItem("code", log.code);
                  }}
                  class="cursor-pointer hover:bg-indigo-200"
                >
                  {log.code}
                </Badge>
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              {#if log.action}
                <Badge
                  color="blue"
                  onclick={() => {
                    toggleItem("action", log.action);
                  }}
                  class="cursor-pointer hover:bg-blue-200"
                >
                  {log.action}
                </Badge>
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              {#if log.logLevel}
                <Badge
                  color={getLevelColor(log.logLevel)}
                  onclick={() => {
                    toggleItem("level", log.logLevel);
                  }}
                  class="cursor-pointer font-mono"
                >
                  {log.logLevel}
                </Badge>
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </TableBodyCell>
            <TableBodyCell class="max-w-md">
              {#if (log as any).dataProcessed}
                <details class="cursor-pointer">
                  <summary class="text-sm text-blue-600 hover:text-blue-800"
                    >View data</summary
                  >
                  <pre
                    class="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40"
                    >{@html highlightText(
                      JSON.stringify((log as any).dataProcessed, null, 2),
                      filter.text,
                    )}</pre>
                </details>
              {:else}
                <span class="text-gray-400">-</span>
              {/if}
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>

  <!-- Bottom Pagination -->
  {#if totalPages > 1}
    <div class="flex justify-center mt-6">
      <PaginationNav
        {currentPage}
        {totalPages}
        onPageChange={(newPage) => {
          filter.offset = (newPage - 1) * filter.limit;
        }}
      />
    </div>
  {/if}
</Card>