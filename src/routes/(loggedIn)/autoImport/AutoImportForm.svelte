<script lang="ts">
	import SelectInput from '$lib/components/SelectInput.svelte';
	import {
		autoImportFormItemDisplay,
		autoImportFrequencyEnumSelection,
		autoImportTypeDropdown
	} from '$lib/schema/autoImportSchema.js';
	import type { AutoImportFormProxy } from './autoImportFormProxy';
	import TextInput from '$lib/components/TextInput.svelte';
	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import { Accordion, AccordionItem } from 'flowbite-svelte';

	export let proxyForm: AutoImportFormProxy;
	export let importMappingDropdown: { id: string; title: string; enabled: boolean }[];
	export let disabled = false;
	export let lockType = false;
	export let hideEnabled = false;
	export let closeAccordian = false;

	const { value: typeValue, errors: typeErrors } = proxyForm.type;
	const { value: titleValue, errors: titleErrors } = proxyForm.title;
	const { value: enabledValue } = proxyForm.enabled;
	const { value: importMappingIdValue, errors: importMappingIdErrors } = proxyForm.importMappingId;
	const { value: frequencyValue, errors: frequencyErrors } = proxyForm.frequency;
	const { value: accountIdValue, errors: accountIdErrors } = proxyForm.accountId;
	const { value: appAccessTokenValue, errors: appAccessTokenErrors } = proxyForm.appAccessToken;
	const { value: appIdValue, errors: appIdErrors } = proxyForm.appId;
	const { value: connectionIdValue, errors: connectionIdErrors } = proxyForm.connectionId;
	const { value: secretValue, errors: secretErrors } = proxyForm.secret;
	const { value: userAccessTokenValue, errors: userAccessTokenErrors } = proxyForm.userAccessToken;
	const { value: lookbackDaysValue, errors: lookbackDaysErrors } = proxyForm.lookbackDays;
	const { value: startDateValue, errors: startDateErrors } = proxyForm.startDate;
	const { value: autoProcessValue } = proxyForm.autoProcess;
	const { value: autoCleanValue } = proxyForm.autoClean;

	$: formElements = autoImportFormItemDisplay[$typeValue];
</script>

<TextInput
	bind:value={$titleValue}
	title="Title"
	name="title"
	required
	errorMessage={$titleErrors}
	{disabled}
/>

<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
	{#if !hideEnabled}
		<BooleanFilterButtons bind:value={$enabledValue} title="Enabled" hideClear {disabled} />
	{/if}
	<input type="hidden" name="enabled" value={$enabledValue} />

	<SelectInput
		title="Import Mapping"
		name="importMappingId"
		bind:value={$importMappingIdValue}
		items={importMappingDropdown.map((t) => ({ name: t.title, value: t.id }))}
		placeholder="Select Import Mapping..."
		required
		errorMessage={$importMappingIdErrors}
		{disabled}
	/>
	<SelectInput
		title="Update Frequency"
		name="frequency"
		bind:value={$frequencyValue}
		items={autoImportFrequencyEnumSelection}
		placeholder="Select Update Frequency..."
		required
		errorMessage={$frequencyErrors}
		{disabled}
	/>
	<BooleanFilterButtons
		value={$autoProcessValue}
		name="autoProcess"
		title="Processing"
		onTitle="Auto"
		offTitle="Manual"
		hideClear
	/>
	<BooleanFilterButtons
		value={$autoCleanValue}
		name="autoClean"
		title="Cleaning"
		onTitle="Auto"
		offTitle="Manual"
		hideClear
	/>
</div>
<Accordion>
	<AccordionItem open={!closeAccordian}>
		<span slot="header">Source Details</span>
		<div class="flex flex-col gap-2">
			<SelectInput
				title="Type / Source"
				name="type"
				bind:value={$typeValue}
				items={autoImportTypeDropdown}
				placeholder="Select Auto Import Source..."
				required
				errorMessage={$typeErrors}
				disabled={disabled || lockType}
			/>
			<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
				{#if formElements.accountId}
					<TextInput
						bind:value={$accountIdValue}
						title="Account ID"
						name="accountId"
						required
						errorMessage={$accountIdErrors}
						{disabled}
					/>
				{/if}
				{#if formElements.appAccessToken}
					<TextInput
						bind:value={$appAccessTokenValue}
						title="App Access Token"
						name="appAccessToken"
						required
						errorMessage={$appAccessTokenErrors}
						{disabled}
					/>
				{/if}
				{#if formElements.appId}
					<TextInput
						bind:value={$appIdValue}
						title="App ID"
						name="appId"
						required
						errorMessage={$appIdErrors}
						{disabled}
					/>
				{/if}
				{#if formElements.connectionId}
					<TextInput
						bind:value={$connectionIdValue}
						title="Connection ID"
						name="connectionId"
						required
						errorMessage={$connectionIdErrors}
						{disabled}
					/>
				{/if}
				{#if formElements.secret}
					<TextInput
						bind:value={$secretValue}
						title="Secret"
						name="secret"
						required
						errorMessage={$secretErrors}
						{disabled}
					/>
				{/if}
				{#if formElements.userAccessToken}
					<TextInput
						bind:value={$userAccessTokenValue}
						title="User Access Token"
						name="userAccessToken"
						required
						errorMessage={$userAccessTokenErrors}
						{disabled}
					/>
				{/if}
				{#if formElements.lookbackDays}
					<NumberInput
						bind:value={$lookbackDaysValue}
						title="Lookback Days"
						name="lookbackDays"
						required
						errorMessage={$lookbackDaysErrors}
						{disabled}
						numberDecimals={0}
					/>
				{/if}
				{#if formElements.startDate}
					<TextInput
						bind:value={$startDateValue}
						title="Start Date"
						name="startDate"
						errorMessage={$startDateErrors}
						{disabled}
					/>
				{/if}
			</div>
		</div>
	</AccordionItem>
</Accordion>
