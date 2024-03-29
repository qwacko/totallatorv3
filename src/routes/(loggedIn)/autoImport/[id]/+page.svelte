<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { ButtonGroup, Badge, } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import { formFieldProxy, superForm } from 'sveltekit-superforms';
	import AutoImportForm from '../AutoImportForm.svelte';
	import type { AutoImportFormProxy } from '../autoImportFormProxy';
	import GetData from './GetData.svelte';
	import UpdateSampleData from './UpdateSampleData.svelte';

	export let data;

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
		userAccessToken: formFieldProxy(form, 'userAccessToken')
	};

	$: title = data.autoImportDetail.title;

	let updatingEnabled = false;
	let errorMessage: string | undefined = undefined;

	$: enhanceForm = form.enhance;
</script>

<CustomHeader pageTitle={title} />

<PageLayout {title}>
	<svelte:fragment slot="right">
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
			<ButtonGroup outline>
				<ActionButton
					type="submit"
					color="green"
					name="enable"
					value={true}
					outline={!data.autoImportDetail.enabled}
					message="Enabled"
					loadingMessage=" "
					loading={updatingEnabled}
				/>
				<ActionButton
					type="submit"
					color="red"
					name="disable"
					value={true}
					outline={data.autoImportDetail.enabled}
					message="Disabled"
					loadingMessage=" "
					loading={updatingEnabled}
				/>
			</ButtonGroup>
		</form>
	</svelte:fragment>
	{#if errorMessage}
		<Badge color="red" title="Error">{errorMessage}</Badge>
	{/if}
	<div class="flex flex-row gap-2">
		<GetData
			id={data.autoImportDetail.id}
			filename="{new Date().toISOString().slice(0, 10)}-{data.autoImportDetail.title}.data"
		/>
		<UpdateSampleData importMappingId={data.autoImportDetail.importMappingId} />
	</div>
	<form use:enhanceForm method="post" action="?/update" class="flex flex-col gap-2">
		<input type="hidden" name="id" value={data.autoImportDetail.id} />
		<AutoImportForm
			{proxyForm}
			importMappingDropdown={data.importMappingDropdown}
			disabled={updatingEnabled}
			lockType
			hideEnabled
			closeAccordian
		/>
		<ActionButton
			type="submit"
			loading={updatingEnabled}
			message="Update"
			loadingMessage="Updating..."
		/>
	</form>
</PageLayout>
