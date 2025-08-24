<script lang="ts">
	import { Badge, Button, ButtonGroup } from 'flowbite-svelte';
	import { formFieldProxy, superForm } from 'sveltekit-superforms';

	import { enhance } from '$app/forms';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import ImportLinkList from '$lib/components/ImportLinkList.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { urlGenerator } from '$lib/routes';

	import AutoImportForm from '../AutoImportForm.svelte';
	import type { AutoImportFormProxy } from '../autoImportFormProxy';
	import GetData from './GetData.svelte';
	import UpdateSampleData from './UpdateSampleData.svelte';

	const { data } = $props();

	const form = superForm(data.form, {
		onSubmit: () => {
			updatingEnabled = true;
		},
		onResult: () => {
			updatingEnabled = false;
		}
	});

	const proxyForm: AutoImportFormProxy = {
		title: formFieldProxy(form, 'title'),
		enabled: formFieldProxy(form, 'enabled'),
		importMappingId: formFieldProxy(form, 'importMappingId'),
		frequency: formFieldProxy(form, 'frequency'),
		type: formFieldProxy(form, 'type'),
		accountId: formFieldProxy(form, 'accountId'),
		appAccessToken: formFieldProxy(form, 'appAccessToken'),
		appId: formFieldProxy(form, 'appId'),
		connectionId: formFieldProxy(form, 'connectionId'),
		lookbackDays: formFieldProxy(form, 'lookbackDays'),
		secret: formFieldProxy(form, 'secret'),
		startDate: formFieldProxy(form, 'startDate'),
		userAccessToken: formFieldProxy(form, 'userAccessToken'),
		autoProcess: formFieldProxy(form, 'autoProcess'),
		autoClean: formFieldProxy(form, 'autoClean')
	};

	const title = $derived(data.autoImportDetail.title);

	let updatingEnabled = $state(false);
	let errorMessage = $state<string | undefined>(undefined);

	const enhanceForm = $derived(form.enhance);
</script>

<CustomHeader pageTitle={title} />

<PageLayout {title}>
	{#snippet slotRight()}
		<form
			action="?/enableDisable"
			method="post"
			use:enhance={customEnhance({
				updateLoading: (newLoading) => (updatingEnabled = newLoading),
				onSubmit: () => (errorMessage = undefined),
				onError: async () => {
					errorMessage = 'Error Setting Enabled/Disabled Status';
				},
				onFailure: async () => {
					errorMessage = 'Error Setting Enabled/Disabled Status';
				}
			})}
		>
			<ButtonGroup>
				<ActionButton
					type="submit"
					color="green"
					name="enable"
					outline={!data.autoImportDetail.enabled}
					message="Enabled"
					loadingMessage=" "
					loading={updatingEnabled}
				/>
				<ActionButton
					type="submit"
					color="red"
					name="disable"
					outline={data.autoImportDetail.enabled}
					message="Disabled"
					loadingMessage=" "
					loading={updatingEnabled}
				/>
			</ButtonGroup>
		</form>
	{/snippet}
	{#if errorMessage}
		<Badge color="red" title="Error">{errorMessage}</Badge>
	{/if}
	<div class="flex flex-row gap-2">
		<GetData />
		<UpdateSampleData
			filename="{new Date().toISOString().slice(0, 10)}-{data.autoImportDetail.title}.data"
			autoImportId={data.autoImportDetail.id}
			importMappingId={data.autoImportDetail.importMappingId}
		/>
	</div>
	<form use:enhanceForm method="post" action="?/update" class="flex flex-col gap-2">
		<input type="hidden" name="id" value={data.autoImportDetail.id} />
		<AutoImportForm {proxyForm} disabled={updatingEnabled} lockType hideEnabled closeAccordian />
		<ActionButton
			type="submit"
			loading={updatingEnabled}
			message="Update"
			loadingMessage="Updating..."
		/>
	</form>
	<Button
		color="red"
		href={urlGenerator({
			address: '/(loggedIn)/autoImport/[id]/delete',
			paramsValue: { id: data.autoImportDetail.id }
		}).url}
	>
		<DeleteIcon />Delete
	</Button>
	{#await data.imports then importList}
		<ImportLinkList
			title="Last {data.importListFilter.pageSize} Imports"
			data={importList.details}
			filter={data.importListFilter}
		/>
	{/await}
</PageLayout>
