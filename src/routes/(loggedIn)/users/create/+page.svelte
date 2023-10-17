<script lang="ts">
	import { goto } from '$app/navigation';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import type { signupSchemaType } from '$lib/schema/signupSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<signupSchemaType>(data.form, {
		taintedMessage: null,
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				await goto('/users');
			}
		}
	});
</script>

<CustomHeader pageTitle="New User" />

<PageLayout title="New User">
	<form method="POST" autocomplete="off" use:enhance class="flex flex-col gap-4">
		<TextInput
			title="Name"
			errorMessage={$errors.name}
			id="name"
			name="name"
			type="text"
			data-invalid={$errors.name}
			bind:value={$form.name}
			{...$constraints.name}
		/>
		<TextInput
			title="Username"
			errorMessage={$errors.username}
			id="username"
			name="username"
			type="text"
			data-invalid={$errors.username}
			bind:value={$form.username}
			{...$constraints.username}
		/>
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
			<Button type="submit" color="blue">Create</Button>
			<div class="flex flex-grow" />
			<Button
				href={urlGenerator({ address: '/(loggedIn)/users', searchParamsValue: { page: 0 } }).url}
				outline
			>
				Cancel
			</Button>
		</div>
	</form>
</PageLayout>
