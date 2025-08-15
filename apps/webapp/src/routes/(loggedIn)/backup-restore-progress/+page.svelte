<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let progress = data.progress;
  let refreshInterval: NodeJS.Timeout | null = null;

  // Auto-refresh progress every 2 seconds if not completed
  onMount(() => {
    if (shouldAutoRefresh(progress)) {
      refreshInterval = setInterval(async () => {
        try {
          const response = await fetch($page.url.pathname);
          if (response.ok) {
            // For simplicity, we'll just reload the page
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to refresh progress:', error);
        }
      }, 2000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  function shouldAutoRefresh(progressData: any): boolean {
    return progressData?.phase && 
           !['completed', 'failed', 'cancelled'].includes(progressData.phase);
  }

  function getPhaseDisplay(phase: string): string {
    switch (phase) {
      case 'starting':
        return 'Starting...';
      case 'retrieving':
        return 'Retrieving backup data';
      case 'pre-backup':
        return 'Preparing restoration';
      case 'deleting':
        return 'Deleting existing data';
      case 'restoring':
        return 'Restoring backup data';
      case 'completed':
        return 'Completed successfully';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return phase;
    }
  }

  function getPhaseColor(phase: string): string {
    switch (phase) {
      case 'starting':
      case 'retrieving':
      case 'pre-backup':
      case 'deleting':
      case 'restoring':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'cancelled':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  function canGoBack(): boolean {
    return progress?.phase && ['completed', 'failed', 'cancelled'].includes(progress.phase);
  }

  async function handleGoBack() {
    if (canGoBack()) {
      await goto('/backup');
    }
  }
</script>

<svelte:head>
  <title>Backup Restore Progress - Totallator</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Backup Restore Progress
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Backup ID: {progress.backupId}
      </p>
    </div>

    <!-- Current Status -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Current Status</h2>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatTimestamp(progress.updatedAt)}
        </span>
      </div>

      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-medium {getPhaseColor(progress.phase)}">
            {getPhaseDisplay(progress.phase)}
          </span>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {progress.percentage}%
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {progress.percentage}%"
          ></div>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{progress.current} of {progress.total}</span>
          {#if progress.message}
            <span class="italic">{progress.message}</span>
          {/if}
        </div>

        {#if progress.error}
          <div class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p class="text-sm text-red-600 dark:text-red-400 font-medium">Error:</p>
            <p class="text-sm text-red-600 dark:text-red-400">{progress.error}</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Action History -->
    {#if progress.actionHistory && progress.actionHistory.length > 0}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Action History</h2>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each progress.actionHistory.slice().reverse() as action}
              <div class="flex items-start justify-between p-3 bg-white dark:bg-gray-600 rounded border">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium {getPhaseColor(action.phase)}">
                      {getPhaseDisplay(action.phase)}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {action.percentage}%
                    </span>
                  </div>
                  {#if action.message}
                    <p class="text-sm text-gray-600 dark:text-gray-400">{action.message}</p>
                  {/if}
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {action.current} of {action.total} • {formatTimestamp(action.timestamp)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Additional Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">Restore Details</h3>
        <dl class="space-y-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-600 dark:text-gray-400">Include Users:</dt>
            <dd class="text-gray-900 dark:text-white">{progress.includeUsers ? 'Yes' : 'No'}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600 dark:text-gray-400">Started:</dt>
            <dd class="text-gray-900 dark:text-white">{formatTimestamp(progress.startedAt)}</dd>
          </div>
          {#if progress.completedAt}
            <div class="flex justify-between">
              <dt class="text-gray-600 dark:text-gray-400">Completed:</dt>
              <dd class="text-gray-900 dark:text-white">{formatTimestamp(progress.completedAt)}</dd>
            </div>
          {/if}
          {#if progress.duration}
            <div class="flex justify-between">
              <dt class="text-gray-600 dark:text-gray-400">Duration:</dt>
              <dd class="text-gray-900 dark:text-white">{Math.round(progress.duration / 1000)}s</dd>
            </div>
          {/if}
        </dl>
      </div>

      {#if shouldAutoRefresh(progress)}
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 class="font-medium text-blue-900 dark:text-blue-200 mb-2">Status</h3>
          <p class="text-sm text-blue-600 dark:text-blue-400">
            This page will automatically refresh every 2 seconds while the restore is in progress.
          </p>
          <div class="mt-2 flex items-center text-blue-600 dark:text-blue-400">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm">Auto-refreshing...</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {#if shouldAutoRefresh(progress)}
          Please wait for the restore to complete before navigating away.
        {:else}
          The restore process has finished. You can now return to the backup management.
        {/if}
      </div>
      
      {#if canGoBack()}
        <button 
          on:click={handleGoBack}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Backup Management
        </button>
      {:else}
        <button 
          disabled
          class="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
        >
          Restore in Progress...
        </button>
      {/if}
    </div>
  </div>
</div>