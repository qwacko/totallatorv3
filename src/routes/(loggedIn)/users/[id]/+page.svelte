<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import { urlGenerator } from '$lib/routes';
	import {
		currencyFormatEnum,
		dateFormatEnum,
		formatDate,
		getCurrencyFormatter
	} from '$lib/schema/userSchema.js';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';

	const { data } = $props();

	let loading = $state(false);

	const form = superForm(data.form, {
		...superFormNotificationHelper({
			errorMessage: 'Failed to update user info',
			successMessage: 'User info updated',
			setLoading: (value) => (loading = value),
			invalidate: true
		})
	});

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);
	const errors = $derived(form.errors);
</script>

<CustomHeader pageTitle="User - {data ? data.currentUser.name : ''}" />
<PageLayout title="User - {data ? data.currentUser.name : ''}">
	{#if data.currentUser}
		<div class="flex flex-row items-center gap-2">
			{data.currentUser.username}
			{#if data.currentUser.admin}
				(Admin)
			{/if}
			<div class="flex flex-grow"></div>
			{#if data.canSetAdmin}
				<form action="?/setAdmin" method="POST" use:enhance>
					<Button outline type="submit">Set Admin</Button>
				</form>
			{/if}
			{#if data.canRemoveAdmin}
				<form action="?/removeAdmin" method="POST" use:enhance>
					<Button outline type="submit">Remove Admin</Button>
				</form>
			{/if}

			{#if data.canUpdatePassword}
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/users/[id]/password',
						paramsValue: { id: data.currentUser.id }
					}).url}
					outline
				>
					Edit Password
				</Button>
			{/if}
			{#if data.user?.admin && data.user.id !== data.currentUser.id}
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/users/[id]/delete',
						paramsValue: { id: data.currentUser.id }
					}).url}
					color="red"
					outline
				>
					Delete
				</Button>
			{/if}
		</div>
		{#if data.canUpdateName}
			<form method="post" action="?/updateInfo" use:enhance class="flex flex-col gap-2">
				<TextInputForm {form} field="name" title="Name" disabled={loading} />
				<SelectInput
					bind:value={$formData.currencyFormat}
					title="Currency Format"
					name="currencyFormat"
					errorMessage={$errors.currencyFormat}
					items={currencyFormatEnum.map((currencyFormat) => ({
						value: currencyFormat,
						name: `${currencyFormat} (${getCurrencyFormatter(currencyFormat).format(1234.56)})`
					}))}
					disabled={loading}
				/>
				<SelectInput
					bind:value={$formData.dateFormat}
					title="Date Format"
					name="dateFormat"
					errorMessage={$errors.dateFormat}
					items={dateFormatEnum.map((dateFormat) => ({
						value: dateFormat,
						name: `${dateFormat} (${formatDate(new Date('2020-01-13'), dateFormat)})`
					}))}
					disabled={loading}
				/>
				<Button type="submit" class="whitespace-nowrap">Update User Info</Button>
			</form>
		{/if}
	{:else}
		<ErrorText message="User Not Found" />
	{/if}
</PageLayout>
