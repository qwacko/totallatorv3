<script lang="ts">
  import { Accordion, AccordionItem } from "flowbite-svelte";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";

  import DisplaySettingGroup from "./DisplaySettingGroup.svelte";

  const { data } = $props();

  let openConfig = $state(true);
  let openBackup = $state(true);
  let openImport = $state(true);
  let openDev = $state(true);
  let openLogging = $state(true);
  let opendbLogging = $state(true);
  let openDB = $state(true);
  let openStorage = $state(true);
  let openS3 = $state(true);
  let openLLM = $state(true);

  const trueFalseToButtons = (
    value: boolean,
    onText: string = "True",
    offTest: string = "False",
  ) => {
    return [
      { title: onText, selected: value },
      { title: offTest, selected: !value },
    ];
  };
</script>

<CustomHeader pageTitle="Settings" />

<PageLayout title="Settings" size="lg">
  <Accordion multiple>
    <AccordionItem bind:open={openConfig}>
      {#snippet header()}Configuration{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.configuration}
        data={[
          {
            title: "Signup",
            options: trueFalseToButtons(
              data.settingsToSend.configuration.allowSignup,
              "Allowed",
              "Not Allowed",
            ),
          },
          {
            title: "Automatic Filter Schedule",
            textValue: `${data.settingsToSend.configuration.automaticFilterScheduleText}  (${data.settingsToSend.configuration.automaticFilterSchedule})`,
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openStorage}>
      {#snippet header()}Storage{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.storage}
        data={[
          {
            title: "Backup Directory",
            textValue: data.settingsToSend.storage.backupDir,
          },
          {
            title: "File Storage Directory",
            textValue: data.settingsToSend.storage.fileDir,
          },
          {
            title: "Import Storage Directory",
            textValue: data.settingsToSend.storage.importDir,
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openS3}>
      {#snippet header()}S3 Configuration{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.s3config}
        data={[
          {
            title: "Acccess URL",
            textValue: data.settingsToSend.s3config.s3AccessUrl,
          },
          { title: "Region", textValue: data.settingsToSend.s3config.s3Region },
          {
            title: "Access Key",
            options: trueFalseToButtons(
              data.settingsToSend.s3config.s3AccessKeyPresent,
              "Present",
              "Not Present",
            ),
          },
          {
            title: "Secret Key",
            options: trueFalseToButtons(
              data.settingsToSend.s3config.s3SecretKeyPresent,
              "Present",
              "Not Present",
            ),
          },
          {
            title: "Disable Checksum",
            options: trueFalseToButtons(
              data.settingsToSend.s3config.s3DisableChecksum,
            ),
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openBackup}>
      {#snippet header()}Backup{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.backup}
        data={[
          {
            title: "Backup Schedule",
            textValue: `${data.settingsToSend.backup.backupScheduleText}  (${data.settingsToSend.backup.backupSchedule})`,
          },
          {
            title: "Backup Retention",
            textValue: `${data.settingsToSend.backup.retentionMonths} months`,
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openImport}>
      {#snippet header()}Import{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.import}
        data={[
          {
            title: "Timeout",
            textValue: `${data.settingsToSend.import.importTimeoutMin} minutes`,
          },
          {
            title: "Import Retention",
            textValue: `${data.settingsToSend.import.retentionDays} days`,
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openDev}>
      {#snippet header()}Development Setting{/snippet}}
      <DisplaySettingGroup
        rawData={data.settingsToSend.dev}
        data={[
          {
            title: "Development Mode",
            options: trueFalseToButtons(data.settingsToSend.dev.dev),
          },
          {
            title: "Development Override",
            options: trueFalseToButtons(data.settingsToSend.dev.devOverride),
          },
          {
            title: "Test Mode",
            options: trueFalseToButtons(data.settingsToSend.dev.testEnv),
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openLogging}>
      {#snippet header()}Logging{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.logging}
        data={[
          {
            title: "Logging",
            options: trueFalseToButtons(data.settingsToSend.logging.logging),
          },
          {
            title: "Debug Classes",
            options: [
              {
                title: "Error",
                selected:
                  data.settingsToSend.logging.debugClasses.includes("ERROR"),
              },
              {
                title: "Warnings",
                selected:
                  data.settingsToSend.logging.debugClasses.includes("WARN"),
              },
              {
                title: "Info",
                selected:
                  data.settingsToSend.logging.debugClasses.includes("INFO"),
              },
              {
                title: "Debug",
                selected:
                  data.settingsToSend.logging.debugClasses.includes("DEBUG"),
              },
              {
                title: "Trace",
                selected:
                  data.settingsToSend.logging.debugClasses.includes("TRACE"),
              },
            ],
          },
          {
            title: "Page Timeout",
            textValue: `${data.settingsToSend.logging.pageTimeoutMs / 1000} seconds`,
          },
          {
            title: "Query Logging",
            options: trueFalseToButtons(
              data.settingsToSend.logging.queryLogging,
            ),
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={opendbLogging}>
      {#snippet header()}DB Logging{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.dbLogging}
        data={[
          {
            title: "Enabled",
            options: trueFalseToButtons(
              data.settingsToSend.dbLogging.dbLogEnable,
            ),
          },
          {
            title: "Cache Size",
            textValue: `${data.settingsToSend.dbLogging.dbLogCacheSize} Entries`,
          },
          {
            title: "Memory Cache Duration",
            textValue: `${data.settingsToSend.dbLogging.dbLogCacheTimeout / 1000} s`,
          },
          {
            title: "Storage",
            textValue: `${data.settingsToSend.dbLogging.dbLogStorageHours} hours`,
          },
          {
            title: "Item Storage",
            textValue: `${data.settingsToSend.dbLogging.dbLogStorageCount} entries`,
          },
          {
            title: "Transaction Logging Enabled",
            options: trueFalseToButtons(
              data.settingsToSend.dbLogging.transactionLogEnable,
            ),
          },
          {
            title: "Transaction Logging Enable Start",
            options: trueFalseToButtons(
              data.settingsToSend.dbLogging.transactionLogEnableStart,
            ),
          },
          {
            title: "Transaction Logging Timeout",
            textValue: `${data.settingsToSend.dbLogging.transactionLogTimeMs} ms`,
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openDB}>
      {#snippet header()}Database{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.database}
        data={[
          {
            title: "URL Present",
            options: trueFalseToButtons(
              data.settingsToSend.database.postgresURLPresent,
            ),
          },
          {
            title: "Test URL Present",
            options: trueFalseToButtons(
              data.settingsToSend.database.postgresTestURLPresent,
            ),
          },
          {
            title: "Maximum Connections",
            textValue: `${data.settingsToSend.database.maxConnections}`,
          },
          {
            title: "Testing Delay",
            textValue: `${data.settingsToSend.database.testingDelay} ms`,
          },
          {
            title: "Disable Buffering",
            options: trueFalseToButtons(
              data.settingsToSend.database.disableBuffering,
            ),
          },
          {
            title: "View Refresh Type",
            options: trueFalseToButtons(
              data.settingsToSend.database.concurrentRefresh,
              "Concurrent",
              "Locking",
            ),
          },
          {
            title: "View Refresh Timeout",
            textValue: `${data.settingsToSend.database.viewRefreshTimeout / 1000} seconds`,
          },
        ]}
      />
    </AccordionItem>
    <AccordionItem bind:open={openLLM}>
      {#snippet header()}LLM Configuration{/snippet}
      <DisplaySettingGroup
        rawData={data.settingsToSend.llm}
        data={[
          {
            title: "LLM Review Enabled",
            options: trueFalseToButtons(
              data.settingsToSend.llm.llmReviewEnabled,
            ),
          },
          {
            title: "LLM Review Auto Import",
            options: trueFalseToButtons(
              data.settingsToSend.llm.llmReviewAutoImport,
            ),
          },
          {
            title: "LLM Review Manual Create",
            options: trueFalseToButtons(
              data.settingsToSend.llm.llmReviewManualCreate,
            ),
          },
          {
            title: "LLM Review Schedule",
            textValue: `${data.settingsToSend.llm.llmReviewScheduleText}  (${data.settingsToSend.llm.llmReviewSchedule})`,
          },
          {
            title: "LLM Auto Create Items",
            options: trueFalseToButtons(
              data.settingsToSend.llm.llmAutoCreateItems,
            ),
          },
        ]}
      />
    </AccordionItem>
  </Accordion>
</PageLayout>
