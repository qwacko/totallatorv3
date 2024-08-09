<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import TextInput from '$lib/components/TextInput.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import { page } from '$app/stores';
	import { Button } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes.js';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';

	const { data } = $props();

	const { form, errors, constraints, message, enhance } = superForm(data.form);
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
			<div class="flex flex-grow"></div>
			<Button type="submit" style="primary">Update</Button>
			<div class="flex flex-grow"></div>
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/users/[id]',
					paramsValue: { id: $page.params.id }
				}).url}
				outline
			>
				Cancel
			</Button>
			<div class="flex flex-grow"></div>
		</div>
	</form>
</PageLayout>
