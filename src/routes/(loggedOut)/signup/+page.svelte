<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import SpreadButtons from '$lib/components/SpreadButtons.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import type { signupSchemaType } from '$lib/schema/signupSchema.js';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';

	export let data;
	const { form, errors, constraints, message, enhance } = superForm<signupSchemaType>(data.form, {
		taintedMessage: null
	});
</script>

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
		<SpreadButtons>
			<Button type="submit">Sign Up</Button>
			<Button href={urlGenerator({ address: '/(loggedOut)/login' }).url}>Login</Button>
		</SpreadButtons>
	</form>
</PageLayout>
