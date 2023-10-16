<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { passwordSchemaType } from './+page.server.js';
	import TextInput from '$lib/components/TextInput.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import SpreadButtons from '$lib/components/SpreadButtons.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import { page } from '$app/stores';
	import { Button } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes.js';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<passwordSchemaType>(data.form, {
		taintedMessage: null
	});
</script>

<CustomHeader pageTitle="Update Password" filterText={data.currentUser.username} />

<PageLayout title="Update Password">
	<form method="POST" use:enhance>
		<TextInput
			title="Password"
			errorMessage={$errors.password}
			type="password"
			id="password"
			name="password"
			data-invalid={$errors.password}
			bind:value={$form.password}
			{...$constraints.password}
		/>
		<TextInput
			title="Confirm Password"
			errorMessage={$errors.confirmPassword}
			type="password"
			id="confirmPassword"
			name="confirmPassword"
			data-invalid={$errors.confirmPassword}
			bind:value={$form.confirmPassword}
			{...$constraints.confirmPassword}
		/>

		<ErrorText message={$message} />
		<div class="flex flex-row gap-2">
			<div class="flex flex-grow" />
			<Button type="submit" style="primary">Update</Button>
			<div class="flex flex-grow" />
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/users/[id]',
					paramsValue: { id: $page.params.id }
				}).url}
				outline
			>
				Cancel
			</Button>
			<div class="flex flex-grow" />
		</div>
	</form>
</PageLayout>
