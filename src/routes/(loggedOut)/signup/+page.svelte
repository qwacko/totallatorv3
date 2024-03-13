<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { superForm } from 'sveltekit-superforms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	export let data;
	const { form, errors, constraints, message, enhance } = superForm(data.form);
</script>

<CustomHeader pageTitle="Sign Up" />

<PageLayout title="Create Account" size="xs" class="pt-10">
	<form method="POST" class="flex flex-col space-y-4" autocomplete="off" use:enhance>
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
		<div class="flex flex-row justify-between gap-2">
			<Button type="submit">Sign Up</Button>
			<Button href={urlGenerator({ address: '/(loggedOut)/login' }).url}>Login</Button>
		</div>
	</form>
</PageLayout>
