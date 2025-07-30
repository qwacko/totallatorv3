<script lang="ts">
  import { Button } from "flowbite-svelte";

  import ArrowDownIcon from "$lib/components/icons/ArrowDownIcon.svelte";
  import ArrowRightIcon from "$lib/components/icons/ArrowRightIcon.svelte";
  import SmartJsonViewer from "$lib/components/SmartJsonViewer.svelte";

  type SmartJsonViewerProps = {
    data: any;
    level?: number;
    defaultExpanded?: boolean;
  };

  let {
    data,
    level = 0,
    defaultExpanded = false,
  }: SmartJsonViewerProps = $props();

  let isExpanded = $state(defaultExpanded);

  // Check if a string looks like JSON
  function looksLikeJSON(str: string): boolean {
    const trimmed = str.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  }

  // Try to parse a string as JSON, return null if it fails
  function tryParseJSON(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  // Process content to handle escaped newlines and nested JSON
  function processStringContent(str: string): {
    type: "json" | "text";
    content: any;
  } {
    // First, handle escaped newlines
    const withNewlines = str.replace(/\\n/g, "\n");

    // Check if this looks like a structured prompt with JSON
    const jsonMatch = withNewlines.match(/^([^{]+)(\{.*\})$/s);
    if (jsonMatch) {
      const [, prefix, jsonPart] = jsonMatch;
      const parsed = tryParseJSON(jsonPart);
      if (parsed) {
        return {
          type: "json",
          content: {
            prefix: prefix.trim(),
            data: parsed,
          },
        };
      }
    }

    // Try to parse the whole thing as JSON
    if (looksLikeJSON(withNewlines)) {
      const parsed = tryParseJSON(withNewlines);
      if (parsed) {
        return { type: "json", content: parsed };
      }
    }

    // Return as processed text with newlines
    return { type: "text", content: withNewlines };
  }

  // Get the type and display info for a value
  function getValueInfo(value: any): {
    type: string;
    preview: string;
    isExpandable: boolean;
  } {
    if (value === null)
      return { type: "null", preview: "null", isExpandable: false };
    if (value === undefined)
      return { type: "undefined", preview: "undefined", isExpandable: false };

    if (typeof value === "string") {
      const processed = processStringContent(value);
      if (processed.type === "json") {
        return {
          type: "nested-json",
          preview: "Structured Content",
          isExpandable: true,
        };
      }
      return {
        type: "string",
        preview:
          value.length > 100 ? `"${value.substring(0, 100)}..."` : `"${value}"`,
        isExpandable: value.length > 100 || value.includes("\n"),
      };
    }

    if (typeof value === "number")
      return { type: "number", preview: value.toString(), isExpandable: false };
    if (typeof value === "boolean")
      return {
        type: "boolean",
        preview: value.toString(),
        isExpandable: false,
      };

    if (Array.isArray(value)) {
      return {
        type: "array",
        preview: `Array(${value.length})`,
        isExpandable: value.length > 0,
      };
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      return {
        type: "object",
        preview: `Object {${keys.length} keys}`,
        isExpandable: keys.length > 0,
      };
    }

    return { type: "unknown", preview: String(value), isExpandable: false };
  }

  // Use smaller indentation and cap the maximum indent
  const maxIndent = 3; // Maximum 3rem indentation
  const indent = Math.min(level * 0.75, maxIndent);
</script>

<div class="font-mono text-sm" style="margin-left: {indent}rem">
  {#if typeof data === "object" && data !== null}
    {#if Array.isArray(data)}
      <!-- Array -->
      <div class="text-purple-600 dark:text-purple-400">
        <Button
          size="xs"
          color="secondary"
          class="p-0 text-purple-600 dark:text-purple-400"
          onclick={() => (isExpanded = !isExpanded)}
        >
          {#if isExpanded}
            <ArrowDownIcon height={16} width={16} />
          {:else}
            <ArrowRightIcon height={16} width={16} />
          {/if}
          Array({data.length})
        </Button>
      </div>
      {#if isExpanded}
        {#each data as item, index}
          <div class="ml-2 border-l border-gray-200 pl-2 dark:border-gray-600">
            <span class="text-blue-600 dark:text-blue-400">[{index}]:</span>
            <SmartJsonViewer data={item} level={level + 1} {defaultExpanded} />
          </div>
        {/each}
      {/if}
    {:else}
      <!-- Object -->
      <div class="text-green-600 dark:text-green-400">
        <Button
          size="xs"
          class="p-0 text-green-600 dark:text-green-400"
          onclick={() => (isExpanded = !isExpanded)}
        >
          {#if isExpanded}
            <ArrowDownIcon height={16} width={16} />
          {:else}
            <ArrowRightIcon height={16} width={16} />
          {/if}
          Object ({Object.keys(data).length} keys)
        </Button>
      </div>
      {#if isExpanded}
        {#each Object.entries(data) as [key, value]}
          {@const info = getValueInfo(value)}
          <div class="ml-2 border-l border-gray-200 pl-2 dark:border-gray-600">
            <span class="text-blue-600 dark:text-blue-400">"{key}":</span>
            {#if info.isExpandable}
              {#if info.type === "nested-json" && typeof value === "string"}
                <!-- Special handling for nested JSON content -->
                {@const processed = processStringContent(value)}
                {#if processed.content.prefix}
                  <div
                    class="mt-1 whitespace-pre-wrap text-gray-600 dark:text-gray-400"
                  >
                    {processed.content.prefix}
                  </div>
                {/if}
                <SmartJsonViewer
                  data={processed.content.data || processed.content}
                  level={level + 1}
                  {defaultExpanded}
                />
              {:else if info.type === "string" && typeof value === "string"}
                <!-- Long or multiline string -->
                <div class="text-orange-600 dark:text-orange-400">
                  <Button
                    size="xs"
                    color="secondary"
                    class="p-0 text-orange-600 dark:text-orange-400"
                    onclick={() => (isExpanded = !isExpanded)}
                  >
                    {#if isExpanded}
                      <ArrowDownIcon height={16} width={16} />
                    {:else}
                      <ArrowRightIcon height={16} width={16} />
                    {/if}
                    String ({value.length} chars)
                  </Button>
                </div>
                {#if isExpanded}
                  <pre
                    class="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs dark:bg-gray-800">{value}</pre>
                {/if}
              {:else}
                <SmartJsonViewer
                  data={value}
                  level={level + 1}
                  {defaultExpanded}
                />
              {/if}
            {:else}
              <!-- Simple value -->
              <span
                class="text-{info.type === 'string'
                  ? 'orange'
                  : info.type === 'number'
                    ? 'red'
                    : info.type === 'boolean'
                      ? 'purple'
                      : 'gray'}-600 dark:text-{info.type === 'string'
                  ? 'orange'
                  : info.type === 'number'
                    ? 'red'
                    : info.type === 'boolean'
                      ? 'purple'
                      : 'gray'}-400"
              >
                {info.preview}
              </span>
            {/if}
          </div>
        {/each}
      {/if}
    {/if}
  {:else}
    <!-- Primitive value -->
    {@const info = getValueInfo(data)}
    <span
      class="text-{info.type === 'string'
        ? 'orange'
        : info.type === 'number'
          ? 'red'
          : info.type === 'boolean'
            ? 'purple'
            : 'gray'}-600 dark:text-{info.type === 'string'
        ? 'orange'
        : info.type === 'number'
          ? 'red'
          : info.type === 'boolean'
            ? 'purple'
            : 'gray'}-400"
    >
      {info.preview}
    </span>
  {/if}
</div>
